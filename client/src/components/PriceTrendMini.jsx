import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

const PriceTrendMini = ({ history = [] }) => (
  <ResponsiveContainer width={140} height={28}>
    <LineChart data={history}>
      <XAxis dataKey="date" hide />
      <YAxis hide />
      <Line type="monotone" dataKey="price" stroke="#3b82f6" dot={false} strokeWidth={2}/>
    </LineChart>
  </ResponsiveContainer>
);

export default PriceTrendMini;
