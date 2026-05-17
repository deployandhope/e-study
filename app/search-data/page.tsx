export const dynamic = "force-dynamic";

import { getChannelBreakdownByMonth, PROPERTIES } from "../lib/ga4";
import { getTopQueries, getCombinedClicksPerDay, GSC_SITES } from "../lib/gsc";
import ChannelChart from "../components/ChannelChart";
import KeywordTable from "../components/KeywordTable";
import ClicksLineChart from "../components/ClicksLineChart";

export default async function SearchData() {
  const [channelResults, keywordResults, dailyClicks] = await Promise.all([
    Promise.all(
      PROPERTIES.map(async (p) => {
        const r = await getChannelBreakdownByMonth(p.id, 20);
        return { name: p.name, ...r };
      })
    ),
    Promise.all(
      GSC_SITES.map(async (s) => {
        const data = await getTopQueries(s.siteUrl, 30, 100);
        return { name: s.name, data };
      })
    ),
    getCombinedClicksPerDay(90),
  ]);

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {channelResults.map((r) => (
          <ChannelChart
            key={r.name}
            title={r.name}
            data={r.data}
            channels={r.channels}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {keywordResults.map((r) => (
          <KeywordTable key={r.name} title={r.name} data={r.data} />
        ))}
      </div>
      <ClicksLineChart
        title="Search Console — kliks per dag"
        subtitle="clicks per dag · afgelopen 90 dagen"
        data={dailyClicks}
        xInterval={6}
      />
    </div>
  );
}
