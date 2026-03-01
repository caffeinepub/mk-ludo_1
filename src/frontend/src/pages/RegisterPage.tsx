import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegister } from "../hooks/useQueries";

interface RegisterPageProps {
  authMode: "login" | "register";
}

export default function RegisterPage({ authMode }: RegisterPageProps) {
  const { login, isLoggingIn } = useInternetIdentity();
  const register = useRegister();
  const [username, setUsername] = useState("muntajkhan");
  const [mobileNumber, setMobileNumber] = useState("");

  const isMobileValid = mobileNumber.length === 10;
  const isFormValid = username.trim().length > 0 && isMobileValid;

  function handleMobileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(value);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    try {
      await register.mutateAsync({
        username: username.trim(),
        mobileNumber,
      });
      toast.success("Welcome to MK Ludo!");
    } catch (_err) {
      toast.error("Registration failed. Try a different username.");
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
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Create Account
                </h2>
                <p className="text-muted-foreground text-sm mt-1 font-body">
                  Choose your battle username
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="font-body text-sm">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. LudoKing007"
                    className="pl-10 bg-input/50 border-border h-12"
                    maxLength={20}
                    autoComplete="username"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  This will be your display name in battles
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="mobileNumber" className="font-body text-sm">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobileNumber"
                    type="tel"
                    inputMode="numeric"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    placeholder="e.g. 9876543210"
                    className="pl-10 bg-input/50 border-border h-12"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  10-digit Indian mobile number
                </p>
                {mobileNumber.length > 0 && !isMobileValid && (
                  <p className="text-xs text-destructive font-body">
                    Please enter a valid 10-digit mobile number
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={register.isPending || !isFormValid}
                className="w-full btn-gold h-12 text-base"
              >
                {register.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {register.isPending ? "Registering..." : "Enter the Arena"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
