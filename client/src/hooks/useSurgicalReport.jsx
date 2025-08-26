import { useEffect, useState } from 'react';
import axios from 'axios';

const useSurgicalReport = () => {
  const [state, setState] = useState({ items: [], totals: {} , loading:true });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('/api/report/surgical');
        if (data.success) setState({ ...data, loading:false });
      } catch (e) {
        console.error('Report fetch failed', e);
        setState(s => ({ ...s, loading:false }));
      }
    })();
  }, []);

  return state;
};

export default useSurgicalReport;
