import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import QuotePage from "./QuotePage.jsx";

export default function EstimateCostingsWrapper() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get("step")) {
      setSearchParams({ step: "scope" }, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <QuotePage />;
}
