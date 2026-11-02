"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

// Линия чертежа «рисуется», когда блок доходит до экрана
function Line({ d, delay, accent }: { d: string; delay: number; accent?: boolean }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={accent ? "#c0612f" : "#a07a52"}
      strokeWidth={accent ? 1.5 : 1.25}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: "easeInOut" }}
    />
  );
}

function Label({ x, y, children, delay }: { x: number; y: number; children: string; delay: number }) {
  return (
    <motion.text
      x={x}
      y={y}
      textAnchor="middle"
      className="fill-primary text-[13px]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      {children}
    </motion.text>
  );
}

export function ConstructorPromo() {
  const t = useT();
  return (
    <section className="bp-paper border-y border-blueprint/18 px-[max(20px,4vw)]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 py-[100px] lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-semibold text-primary">{t.home.constructorKicker}</p>
          <h2 className="font-heading text-[clamp(26px,2.72vw,41px)] leading-[1.12] font-normal tracking-[-0.02em] text-balance">
            {t.home.constructorTitle}
          </h2>
          <p className="max-w-[520px] text-[17px] leading-[1.6] font-light text-soft">{t.home.constructorText}</p>
          <div className="flex flex-wrap gap-2">
            {t.home.constructorTypes.map((type) => (
              <span key={type} className="rounded-xl border border-primary/45 px-3.5 py-[7px] text-[13px] font-semibold">
                {type}
              </span>
            ))}
          </div>
          <Link
            href="/constructor"
            className="lx-gold inline-flex h-[54px] items-center self-start bg-primary px-7 text-[13px] font-bold text-primary-foreground"
          >
            {t.home.constructorCta}
          </Link>
        </div>

        <div className="bp-frame border border-blueprint/30 bg-[rgb(255_250_243/0.65)] p-6 sm:p-10">
          <svg viewBox="0 0 400 320" className="w-full" role="img" aria-label={t.home.constructorTitle}>
            {/* Шкаф: корпус, двери, полки */}
            <Line d="M110 40 H290 V280 H110 Z" delay={0} />
            <Line d="M170 40 V280 M230 40 V280" delay={0.4} />
            <Line d="M110 110 H170 M110 170 H170 M110 230 H170" delay={0.7} />
            <Line d="M160 150 V180 M180 150 V180 M220 150 V180 M240 150 V180" delay={0.9} />

            {/* Размерные линии */}
            <Line d="M110 300 H290 M110 294 V306 M290 294 V306" delay={1.2} accent />
            <Line d="M320 40 V280 M314 40 H326 M314 280 H326" delay={1.4} accent />
            <Label x={200} y={318} delay={2}>{`1600 ${t.common.mm}`}</Label>
            <Label x={360} y={164} delay={2.2}>2200</Label>
            <Label x={200} y={26} delay={2.4}>{t.common.promoDoors}</Label>
          </svg>
        </div>
      </div>
    </section>
  );
}
