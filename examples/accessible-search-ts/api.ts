import data from './../mock-data.json';

type Data = readonly { name: string; id: string }[];

function searchData(query: string): Data {
  return (data as Data).filter(function filterSimilarWords(entry) {
    return entry.name.toLowerCase().startsWith(query.toLowerCase());
  });
}

function query(q: string, delayMs = 150): Promise<Data> {
  return new Promise(function initQuery(resolve) {
    setTimeout(
      function yieldResult(result) {
        resolve(result);
      },
      delayMs,
      searchData(q)
    );
  });
}

export default {
  query,
};
