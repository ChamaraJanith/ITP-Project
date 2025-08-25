import { ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts';

const StockBarMini = ({ qty, min }) => {
  const data = [
    { name: 'Min', value: min },
    { name: 'Qty', value: qty }
  ];
  const fill = qty === 0 ? '#dc2626' : qty <= min ? '#fbbf24' : '#16a34a';

  return (
    <ResponsiveContainer width={120} height={24}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, bottom: 0 }}>
        <Tooltip />
        <Bar dataKey="value" fill={fill} radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StockBarMini;
