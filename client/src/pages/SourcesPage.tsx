import { useTranslation } from 'react-i18next';

interface Source {
  titleKey: string;
  citationKey: string;
  descriptionKey: string;
  linkUrl?: string;
  linkLabel?: string;
}

const DATA_SOURCES: Source[] = [
  {
    titleKey: 'sources.googleMaps.title',
    citationKey: 'sources.googleMaps.citation',
    descriptionKey: 'sources.googleMaps.description',
    linkUrl: 'https://developers.google.com/maps/documentation/distance-matrix',
    linkLabel: 'developers.google.com/maps/documentation/distance-matrix',
  },
  {
    titleKey: 'sources.osm.title',
    citationKey: 'sources.osm.citation',
    descriptionKey: 'sources.osm.description',
    linkUrl: 'https://www.openstreetmap.org/',
    linkLabel: 'openstreetmap.org',
  },
  {
    titleKey: 'sources.cbsCensus.title',
    citationKey: 'sources.cbsCensus.citation',
    descriptionKey: 'sources.cbsCensus.description',
    linkUrl: 'https://www.cbs.gov.il/he/publications/census2022pub/%D7%9E%D7%A4%D7%A7%D7%93-2022.xlsx',
    linkLabel: 'cbs.gov.il — Census 2022 Excel',
  },
  {
    titleKey: 'sources.cbsSocioeconomic.title',
    citationKey: 'sources.cbsSocioeconomic.citation',
    descriptionKey: 'sources.cbsSocioeconomic.description',
    linkUrl: 'https://www.cbs.gov.il/he/publications/doclib/2023/socio_eco19_1903/t12.pdf',
    linkLabel: 'cbs.gov.il — Publication 1903, Table 12 (PDF)',
  },
  {
    titleKey: 'sources.wikipedia.title',
    citationKey: 'sources.wikipedia.citation',
    descriptionKey: 'sources.wikipedia.description',
    linkUrl: 'https://he.wikipedia.org/wiki/%D7%A9%D7%9B%D7%95%D7%A0%D7%95%D7%AA_%D7%91%D7%90%D7%A8_%D7%A9%D7%91%D7%A2',
    linkLabel: 'he.wikipedia.org — שכונות באר שבע',
  },
  {
    titleKey: 'sources.esri.title',
    citationKey: 'sources.esri.citation',
    descriptionKey: 'sources.esri.description',
    linkUrl: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
    linkLabel: 'arcgis.com — World Imagery',
  },
  {
    titleKey: 'sources.madlan.title',
    citationKey: 'sources.madlan.citation',
    descriptionKey: 'sources.madlan.description',
    linkUrl: 'https://www.madlan.co.il/',
    linkLabel: 'madlan.co.il',
  },
  {
    titleKey: 'sources.cbsStatAreas.title',
    citationKey: 'sources.cbsStatAreas.citation',
    descriptionKey: 'sources.cbsStatAreas.description',
    linkUrl: 'https://www.cbs.gov.il/',
    linkLabel: 'cbs.gov.il',
  },
];

const PROJECTS: Source[] = [
  {
    titleKey: 'sources.gmapsScraper.title',
    citationKey: 'sources.gmapsScraper.citation',
    descriptionKey: 'sources.gmapsScraper.description',
    linkUrl: 'https://github.com/gilfriedman/gmaps-scraper',
    linkLabel: 'github.com/gilfriedman/gmaps-scraper',
  },
  {
    titleKey: 'sources.networkAnalyzer.title',
    citationKey: 'sources.networkAnalyzer.citation',
    descriptionKey: 'sources.networkAnalyzer.description',
    linkUrl: 'https://github.com/gilfriedman/traffic-network-analyzer',
    linkLabel: 'github.com/gilfriedman/traffic-network-analyzer',
  },
  {
    titleKey: 'sources.trafficDashboard.title',
    citationKey: 'sources.trafficDashboard.citation',
    descriptionKey: 'sources.trafficDashboard.description',
    linkUrl: 'https://github.com/gilfriedman/traffic-dashboard',
    linkLabel: 'github.com/gilfriedman/traffic-dashboard',
  },
];

const TOOLS_AND_LIBRARIES: Source[] = [
  {
    titleKey: 'sources.osmnx.title',
    citationKey: 'sources.osmnx.citation',
    descriptionKey: 'sources.osmnx.description',
    linkUrl: 'https://github.com/gboeing/osmnx',
    linkLabel: 'github.com/gboeing/osmnx',
  },
  {
    titleKey: 'sources.networkx.title',
    citationKey: 'sources.networkx.citation',
    descriptionKey: 'sources.networkx.description',
    linkUrl: 'https://networkx.org/',
    linkLabel: 'networkx.org',
  },
  {
    titleKey: 'sources.shapely.title',
    citationKey: 'sources.shapely.citation',
    descriptionKey: 'sources.shapely.description',
    linkUrl: 'https://shapely.readthedocs.io/',
    linkLabel: 'shapely.readthedocs.io',
  },
  {
    titleKey: 'sources.mongodb.title',
    citationKey: 'sources.mongodb.citation',
    descriptionKey: 'sources.mongodb.description',
    linkUrl: 'https://www.mongodb.com/atlas',
    linkLabel: 'mongodb.com/atlas',
  },
];

function DescriptionBullet({ line }: { line: string }) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return <li className="text-sm text-slate-700 leading-relaxed">{line}</li>;
  }

  const label = line.slice(0, colonIndex);
  const content = line.slice(colonIndex + 1).trim();

  return (
    <li className="text-sm text-slate-700 leading-relaxed">
      <span className="font-semibold text-slate-800">{label}:</span> {content}
    </li>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const { t } = useTranslation();
  const lines = t(source.descriptionKey).split('\n').filter((line) => line.trim());

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-sm font-bold text-slate-400 mt-0.5">{index + 1}.</span>
        <div className="space-y-2 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{t(source.titleKey)}</h3>
          <p className="text-xs text-slate-500 italic leading-relaxed">{t(source.citationKey)}</p>
          <ul className="list-disc ps-5 space-y-1.5">
            {lines.map((line) => (
              <DescriptionBullet key={line} line={line} />
            ))}
          </ul>
          {source.linkUrl && (
            <a
              href={source.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              {source.linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function SourcesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('sources.title')}</h1>
      <p className="text-sm text-slate-500">{t('sources.subtitle')}</p>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">{t('sources.dataSources')}</h2>
        <div className="grid gap-3">
          {DATA_SOURCES.map((source, index) => (
            <SourceCard key={source.titleKey} source={source} index={index} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">{t('sources.projects')}</h2>
        <div className="grid gap-3">
          {PROJECTS.map((source, index) => (
            <SourceCard key={source.titleKey} source={source} index={index} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">{t('sources.toolsAndLibraries')}</h2>
        <div className="grid gap-3">
          {TOOLS_AND_LIBRARIES.map((source, index) => (
            <SourceCard key={source.titleKey} source={source} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
