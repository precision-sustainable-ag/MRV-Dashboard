import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceDot,
} from 'recharts';

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const getDate = (year, doy) => {
  const date = new Date(year, 0);
  date.setDate(doy);
  if (isValidDate(date)) return date.toISOString().slice(0, 10);
  else return 'NA';
}; // getDate

const Star = ({ cx, cy }) => (
  <text
    x={cx}
    y={cy}
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={50}
    fill="orange"
  >
    ✳
  </text>
);

const Triangle = ({ cx, cy, color }) => (
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

const Chart = () => {
  const [data, setData] = useState([]);
  const [field, setField] = useState('');
  const [fieldData, setFieldData] = useState({});
  const [hlsData, setHlsData] = useState({});
  const [title, setTitle] = useState('');
  const [year1, setYear1] = useState(0);
  const [year2, setYear2] = useState(0);

  useEffect(() => {
    const loadResults = async(dataset, date, sf) => {
      const curveResults = await (await fetch(`https://mrv.covercrop-imagery.org/wisewist?dataset=${dataset}&date=${date}`)).text();
      const d = curveResults.replace(/"/g, '').split(/[\n\r]+/).map((s) => s.split(','));
      const ofs = d[0].findIndex((s) => s[0] === 'X');        // X2024339

      const n = d.findIndex((s) => s[0] === sf);

      setYear1(+(dataset.slice(-4)) - 1);
      setYear2(+(dataset.slice(-4)));

      const curve =
        d[n]
          .slice(ofs)
          .map((value, i) => {
            const year = Number(d[0][i + ofs].slice(1, 5));   // 2024
            const doy  = Number(d[0][i + ofs].slice(5));      // 339

            const date = new Date(year, 0);                   // Jan 1 of that year
            date.setDate(doy);                                // 339th day

            return {
              name: date.toISOString().slice(0, 10),
              value: +value,
            };
          })
          .filter((d) => d.value !== -9999);

      const field = d[n][0];

      setField(field);
      setData(curve);
      setHlsData(Object.fromEntries(d[0].map((col, i) => [col, d[n][i]])));

      const reportResults = await (await fetch(`https://mrv.covercrop-imagery.org/results?dataset=${dataset}&date=${date}`)).text();
      const r = reportResults
        .split(/[\n\r]+/)
        .map((s) => s.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.replace(/"/g, '')));

      const idCol = r[0].indexOf('GlobalID');
      const fd = r.find((row) => row[idCol] === field);
      const fieldData = Object.fromEntries(r[0].map((col, i) => [col, fd[i]]));

      setFieldData(fieldData);

      setTitle([
        fieldData['soy-rye'], fieldData['diverse covers'],
        fieldData.grazing, fieldData['late.term'],
      ].filter((s) => s !== 'NA').join('_'));
    };

    // loadResults('mo2025', '25-0814', '001be21e-11b8-459c-a2ff-424921a79988');
    loadResults('mo2025', '25-0814', '004cc5d1-e285-4d03-a9b9-6ec929faa8d1');
  }, []);

  const plantingPoint = data.find((d) => d.name === fieldData.date);
  const grazingInPoint = data.find((d) => d.name === fieldData['grazing.in']);
  console.log(fieldData['grazing.out']);
  const grazingOutDate = (fieldData['grazing.out'] || 'NA') === 'NA'
    ? 'NA'
    : new Date((fieldData['grazing.out'] - 25569) * 86400000).toISOString().slice(0, 10);
  // const grazingOutPoint = data.find((d) => d.name === fieldData['grazing.out']);
  const grazingOutPoint = data.find((d) => d.name === grazingOutDate);

  console.log(fieldData);
  const agronomy = {
    Cover: fieldData.species,
    'Planting Date': fieldData.date,
    'Seeding Rate': fieldData.rate,
    'Planting Method': fieldData.method,
    Incentive: fieldData['soy-rye'],
    'Late Termination': fieldData['late.term'] === 'LT' ? 'Yes' : 'No',
    Grazing: fieldData.grazing === 'GZ' ? 'Yes' : 'No',
    'Grazing in': fieldData['grazing.in'],
    // 'Grazing out': fieldData['grazing.out'],
    'Grazing out': grazingOutDate,
    'Termination date': fieldData['term.date'],
  };

  const critical = {
    'Termination Date': getDate(year2, hlsData.termination_max),
    'Uncertainty (Days)': hlsData.uncertainty_max,
    'VI Decrease': hlsData.VI_decrease_first,
    MACD: hlsData.termination_momentum_first,
    'Green Up Date': getDate(year2, hlsData['green.up']),
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
    'Max Winter NDVI': winterMax,
    'Max Winter NDVI date': winterDate,
    'Winter Biomass': `${winterBiomass} kg/ha`,
    'Winter Veg Cover': `${winterCover}%`,
    'Max Spring NDVI': springMax,
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
              domain={[-0.2, 1.2]}
              ticks={[-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{
                value: type, angle: -90, position: 'insideLeft', offset: 5,
                style: { fontSize: 18, fontWeight: 'bold' },
              }}
            />
            <Tooltip animationDuration={10} />
            {/* <Legend /> */}
            <Line
              dataKey="value"
              type="monotone" stroke="darkgreen" dot={false} strokeWidth={4}
              name={type}
              isAnimationActive={false}
            />
            {/* <Legend
              verticalAlign="top"
              layout="vertical"
              wrapperStyle={{
                top: 50,
                left: 100,
              }}
            /> */}

            {plantingPoint && (
              <ReferenceDot
                x={plantingPoint.name}
                y={plantingPoint.value}
                isFront
                shape={<Star />}
              />
            )}

            {grazingInPoint && (
              <ReferenceDot
                x={grazingInPoint.name}
                y={grazingInPoint.value}
                isFront
                shape={<Triangle color="brown" />}
              />
            )}

            {grazingOutPoint && (
              <ReferenceDot
                x={grazingOutPoint.name}
                y={grazingOutPoint.value}
                isFront
                shape={<Triangle color="orange" />}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          position: 'absolute',
          fontWeight: 'bold',
          right: 30,
          top: 50,
          fontSize: 16,
          lineHeight: 1.2,
        }}
      >
        {field}
      </div>

      <table
        style={{
          position: 'absolute',
          top: 60,
          left: 100,
          fontSize: 16,
          lineHeight: 1.2,
          background: 'lightyellow',
          padding: 5,
          border: '1px solid #ccc',
        }}
      >
        <tr>
          <td style={{ color: 'darkgreen', fontWeight: 'bold' }}>&mdash;</td>
          <td>Flexfit</td>
          <td style={{ color: '#8b5a90', fontSize: '100%' }}>─■─</td>
          <td>HLS Termination & Uncertainty</td>
        </tr>
        <tr>
          <td style={{ fontSize: '150%', textAlign: 'center' }}>●</td>
          <td>L30</td>
          <td style={{ color: 'brown', textAlign: 'center' }}>▲</td>
          <td>Grazing in</td>
        </tr>
        <tr>
          <td style={{ color: 'blue', fontSize: '150%', textAlign: 'center' }}>●</td>
          <td>S30</td>
          <td style={{ color: 'orange', textAlign: 'center' }}>▲</td>
          <td>Grazing out</td>
        </tr>
        <tr>
          <td style={{ fontSize: '70%', textAlign: 'center' }}>🟧</td>
          <td>HLS Green-Up</td>
          <td style={{ color: 'orange', fontWeight: 'bold', textAlign: 'center' }}>✳</td>
          <td>Planting Date</td>
        </tr>
      </table>
      <Section heading="Agronomy" data={agronomy} style={{ left: 95 }} />
      <Section heading="HLS Critical Points" data={critical} style={{ left: '40%' }} />
      <Section heading="HLS Performance Estimates" data={performance} style={{ right: 30 }} />
    </div>
  );
};

export default Chart;
