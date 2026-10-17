import { useEffect, useRef, useState, useCallback } from 'react';
import shaka from 'shaka-player';
import { LiveChannel } from '../types';

interface UseShakaPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  channel: LiveChannel | null;
  autoPlay?: boolean;
}

interface UseShakaPlayerReturn {
  player: shaka.Player | null;
  isBuffering: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  retry: () => void;
  isSupported: boolean;
}

const MAX_RETRIES = 5;

export function useShakaPlayer({
  videoRef,
  channel,
  autoPlay = true,
}: UseShakaPlayerOptions): UseShakaPlayerReturn {
  const playerRef = useRef<shaka.Player | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const retryTimeoutRef = useRef<number | null>(null);
  const channelRef = useRef<LiveChannel | null>(channel);
  channelRef.current = channel;

  // Clear any scheduled retry
  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Install polyfills once
  useEffect(() => {
    try {
      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        setIsSupported(false);
        setError('Browser does not support Shaka Player (MSE / EME).');
      }
    } catch (e: any) {
      console.warn('Shaka polyfill error', e);
    }
  }, []);

  // Initialize and attach Shaka Player instance
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isSupported) return;

    const player = new shaka.Player();
    playerRef.current = player;

    // Attach video element
    player.attach(video).catch((err: any) => {
      console.error('Shaka attach error:', err);
      setError(`Failed to attach player: ${err?.message || err}`);
    });

    // Listen for buffering events
    const onBuffering = (event: any) => {
      setIsBuffering(Boolean(event.buffering));
    };

    // Listen for player errors
    const onPlayerError = (event: any) => {
      handleError(event.detail);
    };

    player.addEventListener('buffering', onBuffering);
    player.addEventListener('error', onPlayerError);

    return () => {
      clearRetryTimer();
      player.removeEventListener('buffering', onBuffering);
      player.removeEventListener('error', onPlayerError);
      playerRef.current = null;
      player.destroy().catch((err: any) => console.warn('Shaka destroy error', err));
    };
  }, [videoRef, isSupported, clearRetryTimer]);

  // Load stream with backoff retry logic
  const loadChannelStream = useCallback(
    async (targetChannel: LiveChannel, attempt = 0) => {
      const player = playerRef.current;
      const video = videoRef.current;
      if (!player || !video) return;

      if (targetChannel.streamType === 'youtube' || !targetChannel.streamUrl) {
        setIsLoading(false);
        setIsBuffering(false);
        setError(null);
        if (player) {
          player.unload().catch(() => {});
        }
        return;
      }

      clearRetryTimer();
      setIsLoading(true);
      setError(null);

      try {
        // Configure DRM if channel specifies Widevine
        if (targetChannel.drm?.widevineLicenseUrl) {
          const drmConfig: any = {
            servers: {
              'com.widevine.alpha': targetChannel.drm.widevineLicenseUrl,
            },
          };

          if (targetChannel.drm.headers) {
            drmConfig.advanced = {
              'com.widevine.alpha': {
                headers: targetChannel.drm.headers,
              },
            };
          }

          player.configure({ drm: drmConfig });
        } else {
          // Clear any prior DRM config
          player.configure({
            drm: {
              servers: {},
              advanced: {},
            },
          });
        }

        // Configure general streaming resilience
        player.configure({
          streaming: {
            retryParameters: {
              maxAttempts: 3,
              baseDelay: 1000,
              backoffFactor: 2,
            },
            bufferingGoal: 10,
            rebufferingGoal: 2,
          },
        });

        // Determine URL (use proxy if previous direct attempt failed)
        let urlToLoad = targetChannel.streamUrl;
        if (attempt > 1 && !urlToLoad.startsWith('/api/proxy-stream')) {
          urlToLoad = `/api/proxy-stream?url=${encodeURIComponent(urlToLoad)}`;
        }

        // Load the manifest / stream URL
        await player.load(urlToLoad);

        setIsLoading(false);
        setRetryCount(0);
        setError(null);

        if (autoPlay) {
          video.play().catch((playErr: any) => {
            // Autoplay with sound might be blocked; try muted
            if (playErr.name === 'NotAllowedError') {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
        }
      } catch (err: any) {
        console.error(`Shaka load failed (attempt ${attempt}):`, err);
        handleError(err, targetChannel, attempt);
      }
    },
    [autoPlay, videoRef, clearRetryTimer]
  );

  // Handle errors with exponential backoff up to 5 tries
  const handleError = useCallback(
    (err: any, targetChannel?: LiveChannel, currentAttempt?: number) => {
      const activeChannel = targetChannel || channelRef.current;
      if (!activeChannel) return;

      const nextAttempt = (currentAttempt ?? retryCount) + 1;
      setRetryCount(nextAttempt);
      setIsLoading(false);

      const errorMessage =
        err?.message || (typeof err === 'object' ? `Error code ${err.code || 'UNKNOWN'}` : String(err));

      if (nextAttempt <= MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s, 8s (max 8s)
        const delayMs = Math.min(1000 * Math.pow(2, nextAttempt - 1), 8000);
        setError(
          `Stream connection error. Auto-reconnecting (attempt ${nextAttempt}/${MAX_RETRIES} in ${(
            delayMs / 1000
          ).toFixed(0)}s)...`
        );

        clearRetryTimer();
        retryTimeoutRef.current = window.setTimeout(() => {
          if (channelRef.current?.id === activeChannel.id) {
            loadChannelStream(activeChannel, nextAttempt);
          }
        }, delayMs);
      } else {
        setError(
          `Unable to play stream after ${MAX_RETRIES} attempts. ${errorMessage}. Please try another channel or check network connection.`
        );
      }
    },
    [retryCount, clearRetryTimer, loadChannelStream]
  );

  // Manual retry handler
  const retry = useCallback(() => {
    if (channelRef.current) {
      setRetryCount(0);
      loadChannelStream(channelRef.current, 0);
    }
  }, [loadChannelStream]);

  // Load whenever channel changes
  useEffect(() => {
    if (channel && isSupported) {
      setRetryCount(0);
      loadChannelStream(channel, 0);
    }
  }, [channel, isSupported, loadChannelStream]);

  return {
    player: playerRef.current,
    isBuffering,
    isLoading,
    error,
    retryCount,
    retry,
    isSupported,
  };
}
