import { notFound } from "next/navigation";

import { BuySellTicket } from "@/components/dashboard/buy-sell-ticket";
import { getStockById } from "@/constants/stocks";

export default async function StockTradePage({
  params,
}: {
  params: Promise<{ stockId: string }>;
}) {
  const { stockId } = await params;
  const stock = getStockById(stockId);

  if (!stock) {
    notFound();
  }

  return <BuySellTicket stock={stock} />;
}
