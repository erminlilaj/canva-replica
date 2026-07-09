import { useEffect, useState } from "react";
import { hasSeenCoachMarks, markCoachMarksSeen } from "../core/persistence";
import { sq } from "../i18n/sq";

const targets = [".palette", ".canvas-stage", ".primary-action"];

interface Spot {
  top: number;
  left: number;
  placement: "right" | "bottom" | "left";
}

function findSpot(step: number): Spot | undefined {
  const el = document.querySelector(targets[step]);
  if (!el) return undefined;
  const rect = el.getBoundingClientRect();
  if (step === 0) return { top: rect.top + 12, left: rect.right + 12, placement: "right" };
  if (step === 1) return { top: rect.top + 12, left: rect.left + rect.width / 2, placement: "bottom" };
  return { top: rect.bottom + 12, left: rect.right, placement: "left" };
}

export function CoachMarks() {
  const [step, setStep] = useState<number>();
  const [spot, setSpot] = useState<Spot>();

  useEffect(() => {
    hasSeenCoachMarks().then((seen) => {
      if (!seen) setStep(0);
    });
  }, []);

  useEffect(() => {
    if (step === undefined) return;
    const update = () => setSpot(findSpot(step));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step]);

  const finish = () => {
    setStep(undefined);
    void markCoachMarksSeen();
  };

  if (step === undefined || !spot) return null;
  const content = sq.coach.steps[step];
  const isLast = step === sq.coach.steps.length - 1;

  return (
    <div className={`coach-mark coach-mark-${spot.placement}`} style={{ top: spot.top, left: spot.left }}>
      <strong>{content.title}</strong>
      <p>{content.body}</p>
      <div className="coach-mark-actions">
        <button type="button" className="coach-mark-skip" onClick={finish}>
          {sq.coach.skip}
        </button>
        <button
          type="button"
          className="coach-mark-next"
          onClick={() => {
            if (isLast) finish();
            else setStep((current) => (current ?? 0) + 1);
          }}
        >
          {isLast ? sq.coach.done : sq.coach.next}
        </button>
      </div>
    </div>
  );
}
