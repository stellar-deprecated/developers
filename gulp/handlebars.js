import path from 'path';
import _ from 'lodash';

let allFiles = {}

module.exports.helpers = {
	equal(lvalue, rvalue, options) {
		if (arguments.length < 3)
			throw new Error("Handlebars Helper equal needs 2 parameters");
		if( lvalue!=rvalue ) {
			return options.inverse(this);
		} else {
			return options.fn(this);
		}
	},

 eachFile() {
		let args = Array.slice(arguments);
		let options = _.last(args)
			let parts = args.slice(0, args.length-1);
		let filter = path.join(...parts);

		let result = "";

		_.each(allFiles, (f,p) => {
			if (path.extname(p) !== ".html") return;
			if (!_.startsWith(p, filter)) return;

			result += options.fn({path: p, file: f});
		});

		return result;
	},

	sidebarSubMenu(title, options) {
		return `
			<li class="pageNavList__subList">
				<span class="pageNavList__title">${title}</span>
				<ul>	
					${options.fn(this)}	
				</ul>
			</li>
		`;
	},
}


module.exports.setFileList = function(files) {
	allFiles = files
}

