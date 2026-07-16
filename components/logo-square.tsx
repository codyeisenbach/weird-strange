import clsx from "clsx";
import Image from "next/image";
import LogoIcon from "./icons/logo";

const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL;

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        },
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="Logo"
          width={size === "sm" ? 20 : 32}
          height={size === "sm" ? 20 : 32}
          className={clsx("object-contain", {
            "h-[32px] w-[32px]": !size,
            "h-[20px] w-[20px]": size === "sm",
          })}
        />
      ) : (
        <LogoIcon
          className={clsx({
            "h-[16px] w-[16px]": !size,
            "h-[10px] w-[10px]": size === "sm",
          })}
        />
      )}
    </div>
  );
}
