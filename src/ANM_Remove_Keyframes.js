/*
	Remove Keyframes

	A Toon Boom Harmony shelf script. This function removes all transformation keyframes on injected node by deleting each animated attribute's linked column.
	Suppprted nodes are Peg, Drawing, Free Form Deformer, Offset, Curve and Bone.
	Tested on Harmony 17.


	Installation:
	
	1) Download and Unarchive the zip file.
	2) Locate to your user scripts folder (a hidden folder):
	   https://docs.toonboom.com/help/harmony-17/premium/scripting/import-script.html
	   
	3) There is a folder named "src" inside the zip file. Copy all its contents directly to the folder above.
	4) In Harmony, add ANM_Remove_Keyframes function to any toolbar.

	
	Direction:
	
	Select the node(s) to remove keyframes from then run the function.

	
	Author:

		Yu Ueda		
		Many more useful scripts for Toon Boom Harmony are available. Please visit raindropmoment.com	
*/


var scriptVer = "1.00";


function ANM_Remove_Keyframes()
{	
	this.getCompleteNodeList = function(nodeList)
	{
		var foundNodes = [];
		for (var nd = 0; nd < nodeList.length; nd++)
		{
			var curNode = nodeList[nd];	
			foundNodes.push(curNode);			
			if (node.type(curNode) === "GROUP")
			{
				var subNodeList = node.subNodes(curNode);
				subNodeList = this.getCompleteNodeList(subNodeList);
				foundNodes.push.apply(foundNodes, subNodeList);
			}
		}
		return foundNodes;
	};

	// This function removes all keyframes on injected node by deleting each animated attribute's linked column.
	// For peg and drawing transformations, the default value (0 or 1) is assigned as its local value.
	// For deformers, each attribute's resting value is assigned as its local value.
	// For all other nodes, each attribute's value on the start frame is used as its local value (because we don't know what the default value is).
	this.removeKeyframes = function(argNode, startFrame)
	{
		var nodeType = node.type(argNode);

		var pegAttrs = ["position.x", "position.y", "position.z", "position.attr3dpath", "scale.x", "scale.y", "scale.z", "scale.xy", "rotation.anglex", "rotation.angley",	"rotation.anglez", "rotation.QUATERNIONPATH", "skew"];	
		var drawingAttrs = ["offset.x", "offset.y", "offset.z", "offset.attr3dpath", "scale.x", "scale.y", "scale.z", "scale.xy", "rotation.anglex", "rotation.angley", "rotation.anglez", "rotation.QUATERNIONPATH","skew"];
		var ffdAttrs = [".POSITION.X", ".POSITION.Y", ".Rotation" ,".Scale"];
		var offsetAttrs = ["offset.x", "offset.y", "orientation"];	
		var offsetRestAttrs = ["restingoffset.x", "restingoffset.y", "restingorientation"];	
		var curveAttrs = ["offset.x", "offset.y", "orientation0", "length0", "orientation1", "length1"];
		var curveRestAttrs = ["restingoffset.x", "restingoffset.y", "restingorientation0", "restlength0", "restingorientation1", "restlength1"];
		var boneAttrs = ["offset.x", "offset.y", "radius", "orientation", "bias", "length"];
		var boneRestAttrs = ["restoffset.x", "restoffset.y", "restradius", "restorientation", "restbias", "restlength"];


		// Clear drawing, and peg transforamtions.
		if (nodeType === "PEG" || nodeType === "READ")
		{
			var attrs = (nodeType === "PEG")? pegAttrs: drawingAttrs;
			for (var at = 0; at < attrs.length; at++)
			{	
				var col = node.linkedColumn(argNode, attrs[at]);
				if (col !== "")
					// Unlink and remove the column from the current drawing.
					if (node.unlinkAttr(argNode, attrs[at]))
						column.removeUnlinkedFunctionColumn(col);

				if (attrs[at].indexOf("scale") !== -1)
					node.setTextAttr(argNode, attrs[at], 1, 1);
				else
					node.setTextAttr(argNode, attrs[at], 1, 0);
			}
		}
		else if (nodeType === "FreeFormDeformation")
		{		
			var allAttrs = this.getAllAttrs(argNode, [], "", false);
			var attrs = []
			for (var fd = 0; fd < ffdAttrs.length; fd++)
				for (var aa = 0; aa < allAttrs.length; aa++)
					if (allAttrs[aa].indexOf(ffdAttrs[fd]) !== -1)
						attrs.push(allAttrs[aa]);
			
			for (var at = 0; at < attrs.length; at++)
			{	
				var col = node.linkedColumn(argNode, attrs[at]);
				if (col !== "")
					// Unlink and remove the column from the current drawing.
					if (node.unlinkAttr(argNode, attrs[at]))
						column.removeUnlinkedFunctionColumn(col);
					
				 // Note that setting local values to Separate Position attrs also sets local values to 2D Path attrs.
				if (attrs[at].indexOf("POSITION") !== -1)
				{
					var restAttr = attrs[at].replace("POSITION", "restingPosition")
					var val = node.getAttr(argNode, 1, restAttr).doubleValue();
					node.setTextAttr(argNode, attrs[at], 1, val);
				}
				else if (attrs[at].indexOf("Scale") !== -1)
					node.setTextAttr(argNode, attrs[at], 1, 1);
				else
					node.setTextAttr(argNode, attrs[at], 1, 0);
			}		
		}
		else if (nodeType === "OffsetModule" || nodeType === "CurveModule" || nodeType === "BendyBoneModule")
		{
			switch (nodeType)
			{
				case "OffsetModule" : var attrs = offsetAttrs; var restAttrs = offsetRestAttrs; break;
				case "CurveModule" : var attrs = curveAttrs; var restAttrs = curveRestAttrs; break;
				case "BendyBoneModule" : var attrs = boneAttrs; var restAttrs = boneRestAttrs; break;
			}
			
			for (var at = 0; at < attrs.length; at++)
			{
				var col = node.linkedColumn(argNode, attrs[at]);
				if (col !== "")
					// Unlink and remove the column from the current drawing.
					if (node.unlinkAttr(argNode, attrs[at]))
						column.removeUnlinkedFunctionColumn(col);

				var val = node.getAttr(argNode, 1, restAttrs[at]).doubleValue();
				node.setTextAttr(argNode, attrs[at], 1, val);		
			}
		}
		
		// Convert first keyframe value to local value.
		var attrs = this.getAllAttrs(argNode, [], "", true);
		for (var at = 0; at < attrs.length; at++)
		{	
			var val = node.getAttr(argNode, startFrame, attrs[at]).doubleValue();
			
			// Unlink and remove the column from the current drawing.
			var col = node.linkedColumn(argNode, attrs[at]);				
			if (node.unlinkAttr(argNode, attrs[at]))
				column.removeUnlinkedFunctionColumn(col);
			
			node.setTextAttr(argNode, attrs[at], 1, val);
		}	
	};
		

    this.getAllAttrs = function(argNode, validAttrList, parAttrName, skipNonanimatedAttrs)
    {
		var validAttrTypes = ["DOUBLE", "DOUBLEVB", "POINT_2D", "PATH_3D", "QUATERNION_PATH"]
		var attrList = node.getAttrList(argNode, 1, parAttrName);		
		for (var at in attrList)
		{		
			// if current attr is a sub-attr, append parent attr's name'
			var attrName = attrList[at].keyword();				
			if (parAttrName !== "")
				attrName = parAttrName + "." + attrName;
			
			// check if current attr uses one of animatable values
			var attrType = attrList[at].typeName();	
			if (validAttrTypes.indexOf(attrType) !== -1)
			{			
				// check if attr is linked to a column and has at least one keyframe
				if (skipNonanimatedAttrs)
				{
					var col = node.linkedColumn(argNode, attrName);
					if (col !== "" && func.numberOfPoints(col) > 0)
						validAttrList.push(attrName);
				}
				else
					validAttrList.push(attrName);
			}
			
			// check for sub-attrs
			var subAttrCheck = node.getAttrList(argNode, 1, attrName);
			if (subAttrCheck.length > 0)
			{
				var subList = this.getAllAttrs(argNode, [], attrName);
				validAttrList.push.apply(validAttrList, subList);
			}
		}
        return validAttrList;
   };

	var sNodes = selection.selectedNodes();
	sNodes = this.getCompleteNodeList(sNodes);
	
	scene.beginUndoRedoAccum("Remove_Keyframes");	
	for (var nd = 0; nd < sNodes.length; nd++)
		this.removeKeyframes(sNodes[nd], frame.current()); 
	scene.endUndoRedoAccum();		
}