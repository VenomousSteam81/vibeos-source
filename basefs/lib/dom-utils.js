exports.add_ele = add_ele = (node_name, parent, attributes) => Object.assign(parent.appendChild(document.createElement(node_name)), attributes);

exports.sanatize_buffer = exports.add_ele('div', document.body, { style: 'display: none' });

exports.sanatize = str => {
	sanatize_buffer.appendChild(document.createTextNode(str));
	var clean = sanatize_buffer.innerHTML;
	
	sanatize_buffer.innerHTML = '';
	
	return clean;
};

exports.unsanatize = str => {
	sanatize_buffer.innerHTML = str;
	var clean = sanatize_buffer.textContent;
	
	sanatize_buffer.innerHTML = '';
	
	return clean;
};