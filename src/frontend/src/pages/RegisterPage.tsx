import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegister } from "../hooks/useQueries";

interface RegisterPageProps {
  authMode: "login" | "register";
}

export default function RegisterPage({ authMode }: RegisterPageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const register = useRegister();
  const [mobileNumber, setMobileNumber] = useState("");
  const [step, setStep] = useState<"login" | "mobile" | "otp">(
    authMode === "register" && !identity ? "login" : "mobile",
  );
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const firstDigitValid =
    mobileNumber.length === 0 || /^[6-9]/.test(mobileNumber);
  const isMobileValid = mobileNumber.length === 10 && firstDigitValid;

  const mobileError =
    mobileNumber.length > 0 && !firstDigitValid
      ? "Number must start with 6, 7, 8 or 9"
      : mobileNumber.length > 0 && mobileNumber.length < 10
        ? "Please enter all 10 digits"
        : null;

  function handleMobileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
    setOtpVerified(false);
  }

  async function handleSendOtp() {
    if (!isMobileValid) return;
    setOtpSending(true);
    // Simulated OTP send (real SMS not supported on this platform)
    await new Promise((r) => setTimeout(r, 1200));
    setOtpSending(false);
    setStep("otp");
    setOtp("");
    toast.success(`OTP sent to +91 ${mobileNumber}`);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setOtpVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setOtpVerifying(false);
    // Accept any 6-digit OTP (demo mode)
    setOtpVerified(true);
    toast.success("Mobile number verified!");
    // Proceed to register
    try {
      // Generate a unique username using timestamp + random to avoid collisions
      const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`;
      await register.mutateAsync({
        username: `player_${uniqueSuffix}`,
        mobileNumber,
      });
      toast.success("Welcome to MK Ludo!");
    } catch (_err) {
      toast.error("Registration failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/assets/generated/mk-ludo-logo-transparent.dim_300x120.png"
            alt="MK Ludo"
            className="h-20 object-contain mx-auto mb-3"
          />
          <p className="text-muted-foreground font-body text-sm">
            India's Real-Money Ludo Tournament Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 shadow-card">
          {authMode === "login" ? (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Welcome Back
                </h2>
                <p className="text-muted-foreground text-sm mt-1 font-body">
                  Connect your Internet Identity to play
                </p>
              </div>
              <Button
                onClick={() => login()}
                disabled={isLoggingIn}
                className="w-full btn-gold h-12 text-base"
              >
                {isLoggingIn ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                {isLoggingIn ? "Connecting..." : "Login to Play"}
              </Button>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground text-center font-body leading-relaxed">
                  🔐 We use Internet Identity for secure, anonymous
                  authentication. No email or phone needed.
                </p>
              </div>

              {/* Hero image */}
              <div className="rounded-xl overflow-hidden mt-2">
                <img
                  src="/assets/generated/ludo-hero-banner.dim_1200x400.jpg"
                  alt="Play Ludo, Win Real Money"
                  className="w-full object-cover h-36"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { value: "1000+", label: "Players" },
                  { value: "₹50K+", label: "Paid Out" },
                  { value: "24/7", label: "Live Battles" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-gold font-display">
                      {stat.value}
                    </span>
                    <span className="text-xs text-muted-foreground font-body">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Create Account
                </h2>
                <p className="text-muted-foreground text-sm mt-1 font-body">
                  {step === "login"
                    ? "Pehle Internet Identity se connect karo"
                    : "Apna mobile number verify karo"}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                {(["login", "mobile", "otp"] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display transition-colors ${
                        step === s
                          ? "bg-gold text-background"
                          : (step === "mobile" && s === "login") ||
                              (step === "otp" &&
                                (s === "login" || s === "mobile"))
                            ? "bg-green-500/80 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {(step === "mobile" && s === "login") ||
                      (step === "otp" && (s === "login" || s === "mobile"))
                        ? "✓"
                        : i + 1}
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-6 h-0.5 rounded transition-colors ${
                          (step === "mobile" && s === "login") ||
                          (step === "otp" && (s === "login" || s === "mobile"))
                            ? "bg-green-500/80"
                            : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === "login" ? (
                  <motion.div
                    key="login-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                      <p className="text-xs text-muted-foreground text-center font-body leading-relaxed">
                        Step 1: Internet Identity se login karo, phir mobile
                        number verify karna hoga.
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        await login();
                        setStep("mobile");
                      }}
                      disabled={isLoggingIn}
                      className="w-full btn-gold h-12 text-base"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-5 w-5" />
                      )}
                      {isLoggingIn
                        ? "Connecting..."
                        : "Connect Internet Identity"}
                    </Button>
                  </motion.div>
                ) : step === "mobile" ? (
                  <motion.div
                    key="mobile-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="mobileNumber"
                        className="font-body text-sm"
                      >
                        Mobile Number
                      </Label>
                      <div
                        className={`flex items-center h-12 rounded-md border bg-input/50 overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 ${mobileError ? "border-destructive" : "border-border"}`}
                      >
                        <span className="flex items-center justify-center h-full px-3 border-r border-border/60 bg-muted/30 text-foreground font-display font-bold text-sm tracking-wide select-none shrink-0">
                          +91
                        </span>
                        <Input
                          id="mobileNumber"
                          type="tel"
                          inputMode="numeric"
                          value={mobileNumber}
                          onChange={handleMobileChange}
                          placeholder="9876543210"
                          className="border-0 bg-transparent h-full focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-none pl-3 font-body text-sm"
                          maxLength={10}
                          autoComplete="tel"
                          aria-invalid={!!mobileError}
                        />
                      </div>
                      {mobileError ? (
                        <p
                          className="text-xs text-destructive font-body"
                          role="alert"
                        >
                          {mobileError}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground font-body">
                          10-digit Indian mobile number
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleSendOtp}
                      disabled={!isMobileValid || otpSending}
                      className="w-full btn-gold h-12 text-base"
                    >
                      {otpSending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : null}
                      {otpSending ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
                      <p className="text-sm text-muted-foreground font-body">
                        OTP sent to{" "}
                        <span className="font-bold text-foreground">
                          +91 {mobileNumber}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-center">
                      <Label className="font-body text-sm self-start">
                        Enter 6-digit OTP
                      </Label>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={otp.length !== 6 || otpVerifying || otpVerified}
                      className="w-full btn-gold h-12 text-base"
                    >
                      {otpVerifying ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : otpVerified ? (
                        <ShieldCheck className="mr-2 h-5 w-5" />
                      ) : null}
                      {otpVerifying
                        ? "Verifying..."
                        : otpVerified
                          ? "Verified!"
                          : "Verify OTP"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setStep("mobile")}
                      className="text-xs text-muted-foreground font-body underline underline-offset-2 mx-auto"
                    >
                      Change mobile number
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
