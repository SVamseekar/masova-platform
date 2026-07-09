import { realApp } from '../realAppTheme'

type ScaleProps = { t1: string; t2: string; t3: string; t4: string; gap: string; pad: number; sidebar: string; mapH: string; frameH: number }

// Mirrors real CustomerLoginPage.tsx: centered card, gold top border, MaSoVa
// wordmark, welcome heading, success-message banner slot, email/password fields,
// Remember me, red submit, divider, Google button, Create Account + Back-to-Checkout links.
export default function SignInScreen({ s }: { s: ScaleProps }) {
  return (
    <div className="h-full flex items-center justify-center overflow-y-auto">
      <div
        className="rounded-md w-full"
        style={{ background: realApp.surface, border: `1px solid ${realApp.border}`, borderTop: `3px solid ${realApp.gold}`, padding: s.pad, maxWidth: 300 }}
      >
        <div className="text-center mb-2">
          <p className="font-bold" style={{ color: realApp.gold, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>MaSoVa</p>
          <p className="font-bold" style={{ color: realApp.text1, fontFamily: realApp.fontDisplay, fontSize: s.t3 }}>Welcome back</p>
          <p style={{ color: realApp.text3, fontSize: s.t1 }}>Sign in to continue with your order</p>
        </div>

        <div className="rounded-md text-center mb-2" style={{ background: 'rgba(46,125,50,0.12)', border: `1px solid ${realApp.success}`, padding: s.pad * 0.3 }}>
          <span style={{ color: '#4caf50', fontSize: s.t1 }}>Account created — please sign in</span>
        </div>

        <div className={`flex flex-col ${s.gap}`}>
          <div>
            <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Email Address</p>
            <div className="rounded" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, height: s.pad * 0.9 }} />
          </div>
          <div>
            <p className="uppercase tracking-wide mb-1" style={{ color: realApp.text3, fontSize: s.t1 }}>Password</p>
            <div className="rounded" style={{ background: realApp.surface2, border: `1px solid ${realApp.border}`, height: s.pad * 0.9 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="rounded-sm" style={{ width: s.pad * 0.35, height: s.pad * 0.35, border: `1px solid ${realApp.gold}` }} />
            <span style={{ color: realApp.text2, fontSize: s.t1 }}>Remember me</span>
          </div>
          <div className="rounded-full text-center font-bold text-white" style={{ background: realApp.red, padding: `${s.pad * 0.5}px 0`, fontSize: s.t2 }}>
            Login & Continue →
          </div>
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px" style={{ background: realApp.border }} />
          <span style={{ color: realApp.text3, fontSize: s.t1 }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: realApp.border }} />
        </div>
        <div className="rounded flex items-center justify-center gap-1.5" style={{ background: '#1a1a1a', border: `1px solid ${realApp.border}`, padding: `${s.pad * 0.4}px 0` }}>
          <span style={{ color: realApp.text2, fontSize: s.t1 }}>G  Sign in with Google</span>
        </div>

        <p className="text-center mt-2" style={{ color: realApp.text3, fontSize: s.t1 }}>
          Don't have an account? <span style={{ color: realApp.gold }}>Create Account</span>
        </p>
        <p className="text-center mt-1" style={{ color: realApp.text3, fontSize: s.t1, textDecoration: 'underline' }}>
          ← Back to Checkout
        </p>
      </div>
    </div>
  )
}
