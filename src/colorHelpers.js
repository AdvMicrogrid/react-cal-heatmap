var parse = require("parse-color")

// Calculate the color between the two given colors, by the provided percent (as a decimal)
//
// minColor			{colorString}	The starting color, in any form allowed by a web browser
// maxColor			{colorString}	The ending color, in any form allowed by a web browser
// percentBetween 	{Number}		A decimal between 0 and 1, representing how close to the minColor we want our computed color to be
//
// returns 			{String}		A hex color string representing the computed color
export function calculateGradientValue(minColor, maxColor, percentBetween) {
	const parsedMinColor = parse(minColor)["rgb"];
	const parsedMaxColor = parse(maxColor)["rgb"];
	const diffs = [parsedMaxColor[0] - parsedMinColor[0], parsedMaxColor[1] - parsedMinColor[1], parsedMaxColor[2] - parsedMinColor[2]];
	const finalRGB = [parsedMinColor[0] + Math.round(percentBetween * diffs[0]), parsedMinColor[1] + Math.round(percentBetween * diffs[1]), parsedMinColor[2] + Math.round(percentBetween * diffs[2])];

	return "#" + generateNumberString(finalRGB[0], 16, 2) + generateNumberString(finalRGB[1], 16, 2) + generateNumberString(finalRGB[2], 16, 2);
}

export function generateNumberString(num, base, digits) {
	const convertedNum = num.toString(base)
	const padding = "0".repeat(digits - 1)
	const paddedNum = `${padding}${convertedNum}`

	return paddedNum.slice(-1 * digits)
}
