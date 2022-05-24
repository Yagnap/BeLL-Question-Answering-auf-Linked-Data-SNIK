async function select(query, graph, endpoint) {
	const url = endpoint + '?query=' + encodeURIComponent(query) + '&format=json';
	if (graph) {
		url += '&default-graph-uri=' + encodeURIComponent(graph);
	}
	try {
		const response = await fetch(url);

		json = await response.json();
		const bindings = json['results'].bindings;

		console.groupCollapsed('SPARQL ' + query.split('\n', 1)[0] + '...');

		//is never entered on our data with limitation to 99
		if (bindings.length < 100) {
			console.table(
				bindings.map((b) =>
					Object.keys(b).reduce((result, key) => {
						result[key] = b[key].value;
						return result;
					}, {})
				)
			);
		}
		console.debug(query);
		console.debug(url);
		console.groupEnd();

		return bindings;
	} catch (err) {
		console.error(err);
		console.error(`Error executing SPARQL query:\n${query}\nURL: ${url}\n\n`);
		return [];
	}
}
