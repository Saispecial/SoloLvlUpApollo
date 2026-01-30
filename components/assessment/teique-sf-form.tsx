"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { scoreTEIQueSF } from "@/lib/assessments/teique-sf"
import { TEIQUE_QUESTIONS } from "@/lib/assessments/teique-sf-questions"

const LIKERT_SCALE = [
  { value: 1, label: "Completely Disagree" },
  { value: 2, label: "Mostly Disagree" },
  { value: 3, label: "Neither Agree nor Disagree" },
  { value: 4, label: "Mostly Agree" },
  { value: 5, label: "Completely Agree" },
]

interface TEIQueSFFormProps {
  onComplete: (results: any) => void
}

export function TEIQueSFForm({ onComplete }: TEIQueSFFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [currentQuestion]: value })
  }

  const handleNext = () => {
    if (currentQuestion < TEIQUE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Complete assessment
      const results = scoreTEIQueSF(answers)
      onComplete(results)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const progress = ((currentQuestion + 1) / TEIQUE_QUESTIONS.length) * 100
  const currentAnswer = answers[currentQuestion]
  const question = TEIQUE_QUESTIONS[currentQuestion]

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>TEIQue-SF Assessment</CardTitle>
            <span className="text-sm text-foreground/60">
              Question {currentQuestion + 1} of {TEIQUE_QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="py-8">
          <h3 className="text-xl font-semibold mb-6">{question.text}</h3>
          <RadioGroup value={currentAnswer?.toString()} onValueChange={(v) => handleAnswer(Number.parseInt(v))}>
            {LIKERT_SCALE.map((option) => (
              <div key={option.value} className="flex items-center space-x-2 p-3 rounded-warm hover:bg-primary/5">
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="!bg-transparent !border-2 !border-black !text-black hover:!bg-teal-600 hover:!border-teal-600 hover:!text-white"
          >
            {currentQuestion === TEIQUE_QUESTIONS.length - 1 ? (
              "Complete Assessment"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
