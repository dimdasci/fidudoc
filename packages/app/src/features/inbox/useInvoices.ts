import { useQuery } from "@tanstack/react-query";
import { run } from "../../services/client";
import { fetchInvoices } from "../../services/invoices";

export const useInvoices = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: () => run(fetchInvoices),
    staleTime: 30_000,
  });
