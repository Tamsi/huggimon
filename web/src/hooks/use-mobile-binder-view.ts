"use client";

import { useEffect, useState } from "react";

const MOBILE_BINDER_QUERY = "(max-width: 900px)";

export function useMobileBinderView(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BINDER_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}
