import React, { useEffect, useState } from 'react';

const NewsTab = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(
          'https://api.marketaux.com/v1/news/all?api_token=QomNMo4PgtXOwUdRZb5WWPav9QOreXZXaA9i5ahC&countries=IN,US&limit=10'
        );
        const data = await response.json();
        setNews(data.data || []); // MarketAux returns 'data' array
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div>
      <h2>Market News</h2>
      {loading ? (
        <p>Loading news...</p>
      ) : (
        <ul>
          {news.length > 0 ? (
            news.map((item) => (
              <li key={item.uuid}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <p>{item.description}</p>
                <p>
                  {new Date(item.published_at).toLocaleString()} |{' '}
                  {item.source}
                </p>
              </li>
            ))
          ) : (
            <p>No news found.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default NewsTab;
