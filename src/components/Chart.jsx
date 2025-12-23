import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceDot,
} from 'recharts';

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const jday = (d) => {
  const date = new Date(d);  // '2024-09-01' is parsed as UTC

  const year = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));

  const diffMs = date - startOfYear;
  const oneDayMs = 1000 * 60 * 60 * 24;

  return Math.floor(diffMs / oneDayMs) + 1;
};

const CircleShape = ({ cx, cy, color }) => (
  <circle
    cx={cx}
    cy={cy}
    r={6}
    fill={color}
    stroke='black'
    strokeWidth={1}
  />
);

const BoxWhiskersShape = ({ cx, cy, color }) => (
  <g>
    <line
      x1={cx - 20}
      y1={cy + 4}
      x2={cx + 20}
      y2={cy + 4}
      stroke={color}
      strokeWidth={2}
    />

    <rect
      x={cx - 6}
      y={cy - 6}
      width={15}
      height={20}
      fill={color}
      stroke={color}
      strokeWidth={2}
    />
  </g>
);

const StarShape = ({ cx, cy, color }) => (
  <text
    x={cx}
    y={cy}
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={50}
    fill={color}
  >
    ✳
  </text>
);

const TriangleShape = ({ cx, cy, color }) => (
  <polygon
    points={`
      ${cx},${cy - 12}
      ${cx - 12},${cy + 12}
      ${cx + 12},${cy + 12}
    `}
    fill={color}
    stroke="black"
    strokeWidth={1}
  />
);

const SquareShape = ({ cx, cy, color }) => (
  <polygon
    points={`
      ${cx - 10},${cy - 10}
      ${cx - 10},${cy + 10}
      ${cx + 10},${cy + 10}
      ${cx + 10},${cy - 10}
    `}
    fill={color}
    stroke='black'
    strokeWidth={1}
  />
);

const Shape = ({
  point, component: Component, color, ...rest
}) => (
  point && (
    <ReferenceDot
      x={point.name}
      y={point.value}
      isFront
      shape={(props) => <Component {...props} color={color} />}
      {...rest}
    />
  )
);

const Square = ({ point, color, ...rest }) => (
  <Shape point={point} color={color} component={SquareShape} {...rest} />
);

const Triangle = ({ point, color, ...rest }) => (
  <Shape point={point} color={color} component={TriangleShape} {...rest} />
);

const Star = ({ point, color, ...rest }) => (
  <Shape point={point} color={color} component={StarShape} {...rest} />
);

const Whiskers = ({ point, color, ...rest }) => (
  <Shape point={point} color={color} component={BoxWhiskersShape} {...rest} />
);

const Circle = ({ point, color, ...rest }) => (
  <Shape point={point} color={color} component={CircleShape} {...rest} />
);

const Section = ({ heading, data, style }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 75,
      fontSize: 16,
      lineHeight: 1.2,
      background: 'lightyellow',
      padding: 10,
      border: '1px solid #ccc',
      ...style,
    }}
  >
    <div style={{ fontWeight: 'bold' }}>{heading}</div>
    {
      Object.entries(data)
        .map(([key, value]) => (
          <div
            key={key}
            style={{ color: value === 'NA' ? '#aaa' : 'black' }}
          >
            {key} = {value}
          </div>
        ))
    }
  </div>
); // Section

const MyLegend = () => (
  <Box
    component='table'
    sx={{
      position: 'absolute',
      top: 60,
      left: 100,
      fontSize: 16,
      lineHeight: 1.2,
      bgcolor: 'lightyellow',
      p: 0.5,
      border: '1px solid #ccc',
      borderRadius: 1,
      tr: { height: '1.5rem' },
      td: {
        px: 0.75,
        whiteSpace: 'nowrap',
      },
      'td:nth-of-type(odd)': { textAlign: 'center', padding: 0 },
    }}
  >
    <tbody>
      <tr>
        <td style={{ color: 'darkgreen', fontWeight: 'bold' }}>
          &mdash;
        </td>
        <td>Flexfit</td>
        <td style={{ color: '#8b5a90', fontSize: '70%' }}>
          ─█─
        </td>
        <td>HLS Termination &amp; Uncertainty</td>
      </tr>

      <tr>
        <td style={{ fontSize: '150%' }}>●</td>
        <td>L30</td>
        <td style={{ color: 'brown' }}>▲</td>
        <td>Grazing in</td>
      </tr>

      <tr>
        <td style={{ color: 'lightblue', fontSize: '150%' }}>
          ●
        </td>
        <td>S30</td>
        <td style={{ color: 'orange' }}>▲</td>
        <td>Grazing out</td>
      </tr>

      <tr>
        <td style={{ fontSize: '90%' }}>🟧</td>
        <td>HLS Green-Up</td>
        <td style={{ color: 'orange', fontWeight: 'bold' }}>
          ✳
        </td>
        <td>Planting Date</td>
      </tr>
    </tbody>
  </Box>
); // MyLegend

const Chart = () => {
  const [data, setData] = useState([]);
  const [field, setField] = useState('');
  const [fieldData, setFieldData] = useState({});
  const [hlsData, setHlsData] = useState({});
  const [l30s30Data, setL30s30Data] = useState();
  const [l30s30, setL30s30] = useState([]);
  const [lsColumns, setLsColumns] = useState([]);
  const [report, setReport] = useState();
  const [wise, setWise] = useState();
  const [id, setId] = useState('004cc5d1-e285-4d03-a9b9-6ec929faa8d1');
  const [ids, setIds] = useState([]);
  const [title, setTitle] = useState('');
  const [year1, setYear1] = useState(0);
  const [year2, setYear2] = useState(0);

  const jsept1 = jday('2024-09-01');

  const getDate = (doy) => {
    const date = new Date(doy > jsept1 ? year1 : year2, 0);
    date.setDate(doy);
    if (isValidDate(date)) return date.toISOString().slice(0, 10);
    else return 'NA';
  }; // getDate

  const toObject = async (url, key) => {
    const res = await fetch(url);
    const results = await res.text();

    const rows = results
      .trim()
      .split(/[\n\r]+/)
      .map((s) => s.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.replace(/"/g, '')));

    const [header, ...dataRows] = rows;
    const idCol = header.indexOf(key);

    const obj = Object.fromEntries(
      dataRows.map((row) => [row[idCol], row]),
    );

    obj.header = header;

    return obj;
  }; // toObject

  useEffect(() => {
    const loadFiles = async(dataset, date) => {
      const report = await toObject(`https://mrv.covercrop-imagery.org/results?dataset=${dataset}&date=${date}`, 'GlobalID');
      setReport(report);
      const ids = Object.keys(report).sort();
      setIds(ids.filter((id) => id !== 'header'));
      setId(ids[0]);

      const wise = await toObject(`https://mrv.covercrop-imagery.org/wisewist?dataset=${dataset}&date=${date}`, 'GlobalID');
      setWise(wise);

      const l30s30 = await toObject(`https://mrv.covercrop-imagery.org/l30s30?dataset=${dataset}&date=${date}`, 'GlobalID');
      setLsColumns(l30s30.header);
      setL30s30Data(l30s30);

      setYear1(+(dataset.slice(-4)) - 1);
      setYear2(+(dataset.slice(-4)));
    };

    loadFiles('mo2025', '25-0814');
  }, []);

  useEffect(() => {
    const loadResults = async(field) => {
      const ofs = wise.header.findIndex((s) => s[0] === 'X');        // X2024339

      setL30s30(l30s30Data[field]);
      const curve =
        wise[field]
          .slice(ofs)
          .map((value, i) => {
            const year = Number(wise.header[i + ofs].slice(1, 5));   // 2024
            const doy  = Number(wise.header[i + ofs].slice(5));      // 339

            const date = new Date(year, 0);                   // Jan 1 of that year
            date.setDate(doy);                                // 339th day

            return {
              name: date.toISOString().slice(0, 10),
              value: +value,
            };
          })
          .filter((d) => d.value !== -9999);

      setField(field);
      setData(curve);

      setHlsData(Object.fromEntries(wise.header.map((col, i) => [col, wise[field][i]])));

      const fd = report[field];
      const fieldData = Object.fromEntries(report.header?.map((col, i) => [col, fd[i]]));

      setFieldData(fieldData);

      setTitle([
        fieldData['soy-rye'], fieldData['diverse covers'],
        fieldData.grazing, fieldData['late.term'],
      ].filter((s) => s !== 'NA').join('_'));
    };

    if (report && wise && l30s30Data) {
      loadResults(id);
    }
  }, [id, report, wise, l30s30Data]);

  const dfind = (date) => {
    if (+date) { // fieldData['grazing.out']
      date = new Date((fieldData['grazing.out'] - 25569) * 86400000).toISOString().slice(0, 10);
    }

    return data.find((d) => d.name === date);
  };

  const grazingOutDate = (fieldData['grazing.out'] || 'NA') === 'NA'
    ? 'NA'
    : new Date((fieldData['grazing.out'] - 25569) * 86400000).toISOString().slice(0, 10);

  const agronomy = {
    Cover: fieldData.species,
    'Planting Date': fieldData.date,
    'Seeding Rate': fieldData.rate,
    'Planting Method': fieldData.method,
    Incentive: fieldData['soy-rye'],
    'Late Termination': fieldData['late.term'] === 'LT' ? 'Yes' : 'No',
    Grazing: fieldData.grazing === 'GZ' ? 'Yes' : 'No',
    'Grazing in': fieldData['grazing.in'],
    'Grazing out': grazingOutDate,
    'Termination date': fieldData['term.date'],
  };

  const critical = {
    'Termination Date': getDate(hlsData.termination_max),
    'Uncertainty (Days)': hlsData.uncertainty_max,
    'VI Decrease': hlsData.VI_decrease_first,
    MACD: hlsData.termination_momentum_first,
    'Green Up Date': getDate(hlsData['green.up']),
    'Green Up Momentum': hlsData['green.up_momentum'],
  };

  const winterStart = new Date(`${year1}-11-15`);
  const winterStop = new Date(`${year2}-02-28`);
  let winterMax = -Infinity;
  let winterDate = '';
  let winterBiomass = 0;
  let winterCover = 0;

  const springStart = new Date(`${year2}-03-01`);
  const springStop = new Date(`${year2}-05-01`);
  let springMax = -Infinity;
  let springDate = '';
  let springBiomass = 0;
  let springCover = 0;

  data.forEach((row) => {
    const date = new Date(row.name);
    if (date >= springStart && date <= springStop && row.value >= springMax) {
      springMax = row.value;
      springDate = row.name;
      springBiomass = Math.round(Math.exp(4.77794 + 3.7453 * row.value)); // !!! rounds
      springCover = Math.round(-10.783 + 107.566 * row.value);
    } else if (date >= winterStart && date <= winterStop && row.value >= winterMax) {
      winterMax = row.value;
      winterDate = row.name;
      winterBiomass = Math.round(Math.exp(3.2022 + 5.3740 * row.value)); // !!! rounds
      winterCover = Math.round(-21.904 + 116.305 * row.value);
    }
  });

  const performance = {
    'Max Winter NDVI': winterMax.toFixed(2),
    'Max Winter NDVI date': winterDate,
    'Winter Biomass': `${winterBiomass} kg/ha`,
    'Winter Veg Cover': `${winterCover}%`,
    'Max Spring NDVI': springMax.toFixed(2),
    'Max Spring NDVI date': springDate,
    'Spring Biomass': `${springBiomass} kg/ha`,
    'Spring Veg Cover': `${springCover}%`,
  };

  const type = 'NDVI';
  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
    }}>
      <div
        style={{
          float: 'left',
          paddingTop: 5,
        }}
      >
        <select
          onChange={(e) => setId(e.currentTarget.value)}
        >
          {ids.sort().map((id) => <option key={id}>{id}</option>)}
        </select>
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 'bold',
          paddingTop: 5,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10, right: 20, bottom: 40, left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 14 }}
              label={{
                value: 'Date', position: 'insideBottom', offset: -15,
                style: { fontSize: 18, fontWeight: 'bold' },
              }}
            />

            <YAxis
              domain={[-0.4, 1.2]}
              ticks={[-0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{
                value: type, angle: -90, position: 'insideLeft', offset: 5,
                style: { fontSize: 18, fontWeight: 'bold' },
              }}
            />

            <Tooltip animationDuration={10} />

            <Line
              dataKey="value"
              type="monotone" stroke="darkgreen" dot={false} strokeWidth={4}
              name={type}
              isAnimationActive={false}
            />

            {
              lsColumns
                .map((s, i) => {
                  if (l30s30[i] !== 'NA') {
                    if (/L30$/.test(s)) {
                      return (
                        <Circle
                          key={s}
                          point={dfind(getDate(s.slice(5, 8)))}
                          y={l30s30[i]}
                          color="black"
                        />
                      );
                    } else if (/S30$/.test(s)) {
                      return (
                        <Circle
                          key={s}
                          point={dfind(getDate(s.slice(5, 8)))}
                          y={l30s30[i]}
                          color="lightblue"
                        />
                      );
                    }
                  }
                })
            }
            <Star     point={dfind(fieldData.date)}                   color="orange" />
            <Triangle point={dfind(fieldData['grazing.in'])}          color="brown"  />
            <Triangle point={dfind(fieldData['grazing.out'])}         color="orange" />
            <Square   point={dfind(getDate(hlsData['green.up']))}     color="orange" />
            <Whiskers point={dfind(getDate(hlsData.termination_max))} color="purple" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          position: 'absolute',
          fontWeight: 'bold',
          right: 30,
          top: 30,
          fontSize: 16,
          lineHeight: 1.2,
        }}
      >
        {field}
      </div>

      <MyLegend />

      <Section heading="Agronomy" data={agronomy} style={{ left: 95 }} />
      <Section heading="HLS Critical Points" data={critical} style={{ left: '40%' }} />
      <Section heading="HLS Performance Estimates" data={performance} style={{ right: 30 }} />
    </div>
  );
};

export default Chart;
