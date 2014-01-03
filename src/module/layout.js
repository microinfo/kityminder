KityMinder.registerModule( "LayoutModule", function () {
	var CreateChildNodeCommand = kity.createClass( "CreateChildNodeCommand", ( function () {

		return {
			base: Command,
			execute: function ( km, parent, node ) {
				parent.insertChild( node );
			}
		}
	} )() );
	var CreateSiblingNodeCommand = kity.createClass( "reateSiblingNodeCommand", ( function () {

		return {
			base: Command,
			execute: function ( km, sibling, node ) {
				var parent = sibling.getParent();
				parent.insertChild( node );
			}
		}
	} )() );
	var RemoveNodeCommand = kity.createClass( "RemoveNodeCommand", ( function () {

		return {
			base: Command,
			execute: function ( km, node ) {
				var parent = sibling.getParent();
				parent.removeChild( node );
			}
		}
	} )() );
	return {
		"commands": {
			"createchildnode": CreateChildNodeCommand,
			"createsiblingnode": CreateSiblingNodeCommand,
			"removenode": RemoveNodeCommand
		},

		"events": {

		}
	};
} );