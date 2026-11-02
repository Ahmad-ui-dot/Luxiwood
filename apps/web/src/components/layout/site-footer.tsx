import type { PublicSettings } from "@luxiwood/shared";
import { Logo } from "./logo";
import Link from "next/link";
import { api } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

const label = "m-0 text-[13px] font-medium text-blueprint";

export async function SiteFooter() {
  const t = await getT();
  const settings = await api<PublicSettings>("/settings/public").catch(() => null);

  return (
    <footer className="bp-paper relative overflow-hidden border-t border-blueprint/15 bg-[#efe6d8] px-[max(20px,4vw)] pt-16">
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-12">
        <div className="flex max-w-[340px] flex-col gap-[18px]">
          <Logo size={36} />
          <p className="text-[15px] leading-relaxed font-light text-muted-foreground">{t.footer.tag}</p>
        </div>

        <div className="flex flex-col gap-3 text-[15px]">
          <p className={label}>{t.footer.collection}</p>
          <Link href="/catalog?room=LIVING" className="text-soft transition-colors hover:text-primary">{t.footer.living}</Link>
          <Link href="/catalog?room=BEDROOM" className="text-soft transition-colors hover:text-primary">{t.footer.bedroom}</Link>
          <Link href="/catalog?room=DINING" className="text-soft transition-colors hover:text-primary">{t.footer.dining}</Link>
        </div>

        <div className="flex flex-col gap-3 text-[15px] text-soft">
          <p className={label}>{t.footer.contacts}</p>
          <span>{settings?.workshopPhone ?? t.common.phoneStub}</span>
          <span>{t.footer.address}</span>
          <span>{settings?.workshopHours ?? t.common.hoursStub}</span>
        </div>
      </div>

      {/* Указание авторства 3D-моделей обязательно по лицензии CC BY */}
      <p className="mx-auto mt-14 max-w-[1280px] border-t border-blueprint/15 pt-6 text-[13px] text-muted-foreground">{t.footer.credits}</p>

      <p
        aria-hidden="true"
        className="pointer-events-none mt-6 -mb-[0.18em] text-center font-heading text-[clamp(56px,13.2vw,200px)] leading-none font-medium italic whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgb(160_122_82/0.25)]"
      >
        LUXIWOOD
      </p>
    </footer>
  );
}
