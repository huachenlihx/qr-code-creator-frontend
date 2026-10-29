'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

type Challenge = {
  token: string;
  left: number;
  right: number;
  expires_in: number;
  turnstile_required: boolean;
};

export type AntiBotPayload = {
  token: string;
  answer: string;
  website: string;
  turnstile_token: string;
};

export type AntiBotHandle = {
  getPayload: () => AntiBotPayload | null;
  reset: () => Promise<void>;
};

type AntiBotProps = {
  onReadyChange?: (ready: boolean) => void;
  description?: string;
  idPrefix?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const AntiBotVerification = forwardRef<AntiBotHandle, AntiBotProps>(
  function AntiBotVerification(
    {
      onReadyChange,
      description = 'Required for anonymous QR creation.',
      idPrefix = 'anti-bot',
    },
    ref,
  ) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [answer, setAnswer] = useState('');
    const [website, setWebsite] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

    const loadChallenge = useCallback(async () => {
      setLoading(true);
      setError('');
      setAnswer('');
      setWebsite('');
      setTurnstileToken('');

      try {
        const { data } = await api.get<Challenge>('/api/anti-bot/challenge/');
        setChallenge(data);

        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current);
        }
      } catch {
        setError('Could not load verification. Please try again.');
        setChallenge(null);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      void loadChallenge();
    }, [loadChallenge]);

    useEffect(() => {
      if (!siteKey || !challenge?.turnstile_required || !turnstileRef.current) {
        return;
      }

      const render = () => {
        if (!window.turnstile || !turnstileRef.current || widgetId.current) {
          return;
        }

        widgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken(''),
        });
      };

      if (window.turnstile) {
        render();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);

      return () => {
        script.onload = null;
      };
    }, [challenge?.turnstile_required, siteKey]);

    const ready = Boolean(
      challenge &&
        answer.trim() &&
        (!challenge.turnstile_required || Boolean(turnstileToken)),
    );

    useEffect(() => {
      onReadyChange?.(ready);
    }, [ready, onReadyChange]);

    useImperativeHandle(
      ref,
      () => ({
        getPayload: () =>
          challenge
            ? {
                token: challenge.token,
                answer: answer.trim(),
                website,
                turnstile_token: turnstileToken,
              }
            : null,
        reset: loadChallenge,
      }),
      [answer, challenge, loadChallenge, turnstileToken, website],
    );

    return (
      <div className="antiBot">
        <div className="antiBotHeader">
          <ShieldCheck size={18} />
          <div>
            <strong>Human verification</strong>
            <span>{description}</span>
          </div>
        </div>

        {loading ? (
          <p className="muted" role="status">Loading verification…</p>
        ) : challenge ? (
          <>
            <div className="challengeRow">
              <label htmlFor={`${idPrefix}-answer`}>
                What is <b>{challenge.left} + {challenge.right}</b>?
              </label>
              <input
                id={`${idPrefix}-answer`}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode="numeric"
                type="number"
                aria-label="Verification answer"
              />
              <button
                type="button"
                className="iconButton"
                onClick={() => void loadChallenge()}
                title="New question"
                aria-label="Get a new verification question"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            {challenge.turnstile_required && (
              <div ref={turnstileRef} className="turnstileBox" aria-label="Cloudflare Turnstile verification" />
            )}

            <div className="honeypot" aria-hidden="true">
              <label>
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
          </>
        ) : null}

        {error && <p className="fieldError" role="alert">{error}</p>}
      </div>
    );
  },
);

export default AntiBotVerification;
