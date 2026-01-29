"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Shield, Lock, Eye, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PrivacyConsentPage() {
  const [consent, setConsent] = useState({
    emotionalDataConsent: false,
    managerDashboardConsent: false,
    researchDataConsent: false,
    anonymizationLevel: "full" as "full" | "partial" | "none",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    // Save consent preferences
    const consentData = {
      ...consent,
      consentDate: new Date(),
      lastUpdated: new Date(),
    }
    
    // Store in localStorage or send to API
    localStorage.setItem("privacy-consent", JSON.stringify(consentData))
    
    // Log consent action for audit
    const auditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action: "consent_change",
      userId: "current-user", // Replace with actual user ID
      timestamp: new Date(),
      details: consentData,
    }
    
    const auditLogs = JSON.parse(localStorage.getItem("audit-logs") || "[]")
    auditLogs.push(auditLog)
    localStorage.setItem("audit-logs", JSON.stringify(auditLogs))
    
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-success/20 bg-success/5">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-success" />
              </motion.div>
              <CardTitle className="text-2xl text-success">Consent Saved</CardTitle>
              <CardDescription>
                Your privacy preferences have been saved. You can update them anytime in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-warm-gradient-teal"
              >
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Privacy & Data Consent</h1>
          <p className="text-foreground/70 text-lg">
            Your emotional data is sensitive. We respect your privacy and give you full control.
          </p>
        </motion.div>

        {/* AI Disclaimer */}
        <Alert className="border-warning/50 bg-warning/5">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Important: AI Support Boundaries</AlertTitle>
          <AlertDescription className="text-foreground/80">
            This platform uses AI to support your emotional development, but AI is not a replacement for
            professional therapy. If you're experiencing a mental health crisis, please contact a licensed
            mental health professional or emergency services immediately.
          </AlertDescription>
        </Alert>

        {/* Consent Options */}
        <Card className="border-warm rounded-warm-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Data Privacy Options
            </CardTitle>
            <CardDescription>
              Choose how your emotional data is used. You can change these settings anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Emotional Data Consent */}
            <div className="space-y-3 p-4 rounded-warm bg-primary/5 border border-primary/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="emotional-data"
                  checked={consent.emotionalDataConsent}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, emotionalDataConsent: checked as boolean })
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="emotional-data" className="text-base font-semibold cursor-pointer">
                    Emotional Data Processing
                  </Label>
                  <p className="text-sm text-foreground/70">
                    Allow the platform to process and analyze your emotional journal entries, mood
                    reflections, and EI assessment data to provide personalized development recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Manager Dashboard Consent */}
            <div className="space-y-3 p-4 rounded-warm bg-secondary/5 border border-secondary/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="manager-dashboard"
                  checked={consent.managerDashboardConsent}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, managerDashboardConsent: checked as boolean })
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="manager-dashboard" className="text-base font-semibold cursor-pointer">
                    Manager Dashboard (Anonymized)
                  </Label>
                  <p className="text-sm text-foreground/70">
                    Allow your anonymized EI metrics to be included in team-level dashboards. Your
                    individual identity will never be revealed to managers.
                  </p>
                </div>
              </div>
            </div>

            {/* Research Data Consent */}
            <div className="space-y-3 p-4 rounded-warm bg-accent/5 border border-accent/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="research-data"
                  checked={consent.researchDataConsent}
                  onCheckedChange={(checked) =>
                    setConsent({ ...consent, researchDataConsent: checked as boolean })
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="research-data" className="text-base font-semibold cursor-pointer">
                    Research Data (Optional)
                  </Label>
                  <p className="text-sm text-foreground/70">
                    Allow your fully anonymized data to be used for research purposes to improve EI
                    development in healthcare. All identifying information is removed.
                  </p>
                </div>
              </div>
            </div>

            {/* Anonymization Level */}
            <div className="space-y-3 p-4 rounded-warm bg-success/5 border border-success/20">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-success" />
                Anonymization Level
              </Label>
              <p className="text-sm text-foreground/70 mb-3">
                Choose how your data is anonymized when shared (if you consented above):
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-warm hover:bg-success/10">
                  <input
                    type="radio"
                    name="anonymization"
                    value="full"
                    checked={consent.anonymizationLevel === "full"}
                    onChange={(e) => setConsent({ ...consent, anonymizationLevel: e.target.value as any })}
                    className="text-success"
                  />
                  <span className="text-sm">
                    <strong>Full Anonymization:</strong> All identifying information removed, only aggregate
                    patterns shared
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-warm hover:bg-success/10">
                  <input
                    type="radio"
                    name="anonymization"
                    value="partial"
                    checked={consent.anonymizationLevel === "partial"}
                    onChange={(e) => setConsent({ ...consent, anonymizationLevel: e.target.value as any })}
                    className="text-success"
                  />
                  <span className="text-sm">
                    <strong>Partial Anonymization:</strong> Department-level data with minimal identifiers
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-warm hover:bg-success/10">
                  <input
                    type="radio"
                    name="anonymization"
                    value="none"
                    checked={consent.anonymizationLevel === "none"}
                    onChange={(e) => setConsent({ ...consent, anonymizationLevel: e.target.value as any })}
                    className="text-success"
                  />
                  <span className="text-sm">
                    <strong>No Sharing:</strong> Data only used for your personal development
                  </span>
                </label>
              </div>
            </div>

            {/* Compliance Notice */}
            <Alert className="bg-primary/5 border-primary/20">
              <FileText className="h-4 w-4 text-primary" />
              <AlertTitle>Compliance & Your Rights</AlertTitle>
              <AlertDescription className="text-foreground/80">
                This platform follows HIPAA-like privacy principles and aligns with data protection
                regulations (including Indian DPDP Act). You have the right to:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Access your data at any time</li>
                  <li>Request data deletion</li>
                  <li>Update your consent preferences</li>
                  <li>View audit logs of data access</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-warm-gradient-teal text-white hover:opacity-90 h-12 text-base font-semibold"
              size="lg"
            >
              Save Privacy Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
