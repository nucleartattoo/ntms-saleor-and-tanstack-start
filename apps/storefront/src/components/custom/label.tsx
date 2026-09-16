import clsx from "clsx";
import Price from "./price";

const Label = ({
  title,
  amount,
  currencyCode,
  position = "bottom",
}: {
  title: string;
  amount: string;
  currencyCode: string;
  position?: "bottom" | "center";
}) => {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-2.5 pb-2.5 @container/label sm:px-4 sm:pb-4",
        {
          "lg:px-14 lg:pb-12": position === "center",
        },
      )}
    >
      <div className="flex max-w-full items-center rounded-full border border-black/10/16 bg-card/88 p-1 text-[10px] font-semibold text-foreground shadow-[0_10px_24px_rgba(0,0,0,.14)] backdrop-blur-md sm:text-[11px]">
        <h3 className="mr-1.5 line-clamp-2 grow pl-2 leading-tight sm:mr-3 sm:pl-3">
          {title}
        </h3>
        <Price
          className="flex-none rounded-full bg-[#0071e3] px-2 py-1.5 text-black sm:px-3 sm:py-2"
          amount={amount}
          currencyCode={currencyCode}
          currencyCodeClassName="hidden @[275px]/label:inline"
        />
      </div>
    </div>
  );
};

export default Label;
