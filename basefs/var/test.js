//setInterval(() => {
	var s = Date.now();
	
	var test = 1e90;
	
	//for(var i = 0; i <= 1; i++){
	test = 1e99999 >>> 1e99999999;
	//}
	
	console.log(Date.now() - s);
//}, 1);