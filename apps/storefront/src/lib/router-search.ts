type SearchValue = string | number | boolean | null | undefined;
type SearchRecord = Record<string, SearchValue | SearchValue[]>;

export function parseSearch(searchStr: string): SearchRecord {
  const query: SearchRecord = {};
  const params = new URLSearchParams(
    searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
  );

  for (const [key, value] of params.entries()) {
    const previousValue = query[key];

    if (previousValue === undefined) {
      query[key] = value;
    } else if (Array.isArray(previousValue)) {
      previousValue.push(value);
    } else {
      query[key] = [previousValue, value];
    }
  }

  return query;
}

export function stringifySearch(search: SearchRecord) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        appendSearchValue(params, key, item);
      }
    } else {
      appendSearchValue(params, key, value);
    }
  }

  const searchStr = params.toString();
  return searchStr ? `?${searchStr}` : "";
}

function appendSearchValue(
  params: URLSearchParams,
  key: string,
  value: SearchValue,
) {
  if (value === undefined || value === null) {
    return;
  }

  params.append(key, String(value));
}
