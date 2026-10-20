/** Compare only the same journeys covered by both fare options. Values supplied by the reader. */
export function compareFares(singleFare,paidWindows,passPrice) {
 if(!Number.isFinite(singleFare)||singleFare<=0||!Number.isSafeInteger(paidWindows)||paidWindows<1||paidWindows>100||!Number.isFinite(passPrice)||passPrice<=0||singleFare>10000||passPrice>10000) return null;
 const singleCents=Math.round(singleFare*100),passCents=Math.round(passPrice*100);
 if(!singleCents||!passCents) return null;
 const total=singleCents*paidWindows;
 return {singleTotal:total/100,passTotal:passCents/100,saving:(total-passCents)/100,breakEvenWindows:Math.ceil(passCents/singleCents)};
}
