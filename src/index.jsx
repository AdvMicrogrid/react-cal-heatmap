import React, { PropTypes } from 'react';
import range from 'lodash.range';
import reduce from 'lodash.reduce';
import values from 'lodash.values';
import get from 'lodash.get';
import _ from 'lodash'
import moment from "moment"
import { DAYS_IN_WEEK, MILLISECONDS_IN_ONE_DAY, MONTH_LABELS } from './constants';
import { shiftDate, getBeginningTimeForDate, convertToDate } from './dateHelpers';
import { calculateGradientValue } from './colorHelpers';

const SQUARE_SIZE = 10;
const MONTH_LABEL_GUTTER_SIZE = 4;

class CalendarHeatmap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      valueCache: this.getValueCache(props.values, props.endDate, props.numDays),
      dragging: false
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      valueCache: this.getValueCache(nextProps.values, nextProps.endDate, nextProps.numDays),
    })
  }

  getSquareSizeWithGutter() {
    return SQUARE_SIZE + this.props.gutterSize;
  }

  getMonthLabelSize() {
    if (!this.props.showMonthLabels) {
      return 0;
    } else if (this.props.horizontal) {
      return SQUARE_SIZE + MONTH_LABEL_GUTTER_SIZE;
    }
    return 2 * (SQUARE_SIZE + MONTH_LABEL_GUTTER_SIZE);
  }

  getStartDate(endDate, numDays) {
    return shiftDate(endDate, -numDays + 1); // +1 because endDate is inclusive
  }

  getEndDate() {
    return getBeginningTimeForDate(convertToDate(this.props.endDate));
  }

  getStartDateWithEmptyDays(endDate, numDays) {
    return shiftDate(this.getStartDate(endDate, numDays), -this.getNumEmptyDaysAtStart(endDate, numDays));
  }

  getNumEmptyDaysAtStart(endDate, numDays) {
    return this.getStartDate(endDate, numDays).getDay();
  }

  getNumEmptyDaysAtEnd() {
    return (DAYS_IN_WEEK - 1) - this.getEndDate().getDay();
  }

  getWeekCount(endDate, numDays) {
    const numDaysRoundedToWeek = this.props.numDays + this.getNumEmptyDaysAtStart(endDate, numDays) + this.getNumEmptyDaysAtEnd();
    return Math.ceil(numDaysRoundedToWeek / DAYS_IN_WEEK);
  }

  getWeekWidth() {
    return DAYS_IN_WEEK * this.getSquareSizeWithGutter();
  }

  getWidth(endDate, numDays) {
    return (this.getWeekCount(endDate, numDays) * this.getSquareSizeWithGutter()) - this.props.gutterSize;
  }

  getHeight() {
    return this.getWeekWidth() + (this.getMonthLabelSize() - this.props.gutterSize);
  }

  getValueCache(vals, endDate, numDays) {
	const counts = vals.map(v => v["count"])
	const max = get(this.props, "max", Math.max.apply({}, counts))
	const min = get(this.props, "min", Math.min.apply({}, counts))


    return reduce(vals, (memo, value) => {
      const date = convertToDate(value.date);
      const index = Math.floor((date - this.getStartDateWithEmptyDays(endDate, numDays)) / MILLISECONDS_IN_ONE_DAY);
      memo[index] = {
        value,
        className: this.props.classForValue(value),
        title: this.props.titleForValue ? this.props.titleForValue(value) : null,
        tooltipDataAttrs: this.getTooltipDataAttrsForValue(value),
		fillColor: this.getFillColorForValue(value, min, max),
      };
      return memo;
    }, {});
  }

  getFillColorForValue(value, min, max) {
	  const { minColor, maxColor } = this.props;
	  const percent = (value["count"] - min) / (max - min)

	  return calculateGradientValue(minColor, maxColor, percent)
  }

  getValueForIndex(index) {
    if (this.state.valueCache[index]) {
      return this.state.valueCache[index].value;
    }
    return null;
  }

  getClassNameForIndex(index) {
    if (this.state.valueCache[index]) {
      return this.state.valueCache[index].className;
    }
    return this.props.classForValue(null);
  }

  getTitleForIndex(index) {
    if (this.state.valueCache[index]) {
      return this.state.valueCache[index].title;
    }
    return this.props.titleForValue ? this.props.titleForValue(null) : null;
  }

  getTooltipDataAttrsForIndex(index) {
    if (this.state.valueCache[index]) {
      return this.state.valueCache[index].tooltipDataAttrs;
    }
    return this.getTooltipDataAttrsForValue({ date: null, count: null });
  }

  getFillColorForIndex(index) {
    if (this.state.valueCache[index]) {
      return this.state.valueCache[index].fillColor;
    }
    return "#eeeeee";
  }

  getTooltipDataAttrsForValue(value) {
    const { tooltipDataAttrs } = this.props;

    if (typeof tooltipDataAttrs === 'function') {
      return tooltipDataAttrs(value);
    }
    return tooltipDataAttrs;
  }

  getTransformForWeek(weekIndex) {
    if (this.props.horizontal) {
      return `translate(${weekIndex * this.getSquareSizeWithGutter()}, 0)`;
    }
    return `translate(0, ${weekIndex * this.getSquareSizeWithGutter()})`;
  }

  getTransformForMonthLabels() {
    if (this.props.horizontal) {
      return null;
    }
    return `translate(${this.getWeekWidth() + MONTH_LABEL_GUTTER_SIZE}, 0)`;
  }

  getTransformForAllWeeks() {
    if (this.props.horizontal) {
      return `translate(0, ${this.getMonthLabelSize()})`;
    }
    return null;
  }

  getViewBox(endDate, numDays) {
    if (this.props.horizontal) {
      return `0 0 ${this.getWidth(endDate, numDays)} ${this.getHeight()}`;
    }
    return `0 0 ${this.getHeight()} ${this.getWidth(endDate, numDays)}`;
  }

  getSquareCoordinates(dayIndex) {
    if (this.props.horizontal) {
      return [0, dayIndex * this.getSquareSizeWithGutter()];
    }
    return [dayIndex * this.getSquareSizeWithGutter(), 0];
  }

  getMonthLabelCoordinates(weekIndex) {
    if (this.props.horizontal) {
      return [
        weekIndex * this.getSquareSizeWithGutter(),
        this.getMonthLabelSize() - MONTH_LABEL_GUTTER_SIZE,
      ];
    }
    const verticalOffset = -2;
    return [
      0,
      ((weekIndex + 1) * this.getSquareSizeWithGutter()) + verticalOffset,
    ];
  }

  handleClick(e, value) {
    if (this.props.onClick) {
      this.props.onClick(value)
      e.preventDefault()
    }
  }

  handleMouseOver(e, value) {
    if (this.props.onMouseOver) {
      this.props.onMouseOver(value)
    }

    if (this.state.dragging) {
      this.setState({
        dragEnd: value
      })
      e.preventDefault()
    }
  }

  handleMouseDown(e, value) {
    if (this.props.onDrag) {
      this.setState({
        dragStart: value,
        dragging: true
      })
      e.preventDefault()
    }
  }

  handleMouseUp(e, value) {
    if (this.props.onDrag) {
      this.props.onDrag(this.state.dragStart, value)
      this.setState({
        dragStart: null,
        dragEnd: null,
        dragging: false
      })
    }
  }

  scroll(oldEndDate, newEndDate) {
		const diffDays = (moment(newEndDate) - moment(oldEndDate)) / moment.duration(1, "days")

		const cache = _.keys(this.state.valueCache).reduce((newCache, key) => {
			newCache[key - diffDays] = this.state.valueCache[key]
			return newCache
	  }, {})

		this.setState({
				valueCache: cache
		})
  }

  draggedOver(index) {
    if (this.state.dragging && this.state.dragStart && this.state.dragEnd && this.state.valueCache[index]) {
      const date = moment(this.state.valueCache[index].value.date)
      const start = moment(this.state.dragStart.date)
      const end = moment(this.state.dragEnd.date)

      return moment.min(start, end) <= date && date <= moment.max(start, end)
    } else {
      return false
    }
  }

  renderSquare(dayIndex, index, endDate, numDays) {
    const indexOutOfRange = index < this.getNumEmptyDaysAtStart(endDate, numDays) || index >= this.getNumEmptyDaysAtStart(endDate, numDays) + this.props.numDays;
    if (indexOutOfRange && !this.props.showOutOfRangeDays) {
      return null;
    }
    const [x, y] = this.getSquareCoordinates(dayIndex);
    return (
      <rect
        key={index}
        stroke={"white"}
        strokeWidth={this.draggedOver(index) ? 2 : 0}
        width={SQUARE_SIZE}
        height={SQUARE_SIZE}
        x={x}
        y={y}
	      fill={this.getFillColorForIndex(index)}
        title={this.getTitleForIndex(index)}
        onClick={(e) => this.handleClick(e, this.getValueForIndex(index))}
        onMouseOver={(e) => this.handleMouseOver(e, this.getValueForIndex(index))}
        onMouseDown={(e) => this.handleMouseDown(e, this.getValueForIndex(index))}
        onMouseUp={(e) => this.handleMouseUp(e, this.getValueForIndex(index))}
        {...this.getTooltipDataAttrsForIndex(index)}
      />
    );
  }

  renderWeek(weekIndex, endDate, numDays) {
    return (
      <g key={weekIndex} transform={this.getTransformForWeek(weekIndex)}>
        {range(DAYS_IN_WEEK).map(dayIndex => this.renderSquare(dayIndex, (weekIndex * DAYS_IN_WEEK) + dayIndex), endDate, numDays)}
      </g>
    );
  }

  renderAllWeeks(endDate, numDays) {
    return range(this.getWeekCount(endDate, numDays)).map(weekIndex => this.renderWeek(weekIndex, endDate, numDays));
  }

  renderMonthLabels(endDate, numDays, showMonthLabels) {
    if (!showMonthLabels) {
      return null;
    }
    const weekRange = range(this.getWeekCount(endDate, numDays) - 1);  // don't render for last week, because label will be cut off
    return weekRange.map((weekIndex) => {
      const endOfWeek = shiftDate(this.getStartDateWithEmptyDays(endDate, numDays), (weekIndex + 1) * DAYS_IN_WEEK);
      const [x, y] = this.getMonthLabelCoordinates(weekIndex);
      return (endOfWeek.getDate() >= 1 && endOfWeek.getDate() <= DAYS_IN_WEEK) ? (
        <text
          key={weekIndex}
          x={x}
          y={y}
        >
          {MONTH_LABELS[endOfWeek.getMonth()]}
        </text>
      ) : null;
    });
  }

  render() {
	  const { endDate, numDays, showMonthLabels } = this.props

    return (
      <svg
        className="react-calendar-heatmap"
        viewBox={this.getViewBox(endDate, numDays)}
      >
        <g transform={this.getTransformForMonthLabels()}>
          {this.renderMonthLabels(endDate, numDays, showMonthLabels)}
        </g>
        <g transform={this.getTransformForAllWeeks()}>
          {this.renderAllWeeks(endDate, numDays)}
        </g>
      </svg>
    );
  }
}

CalendarHeatmap.propTypes = {
  values: PropTypes.arrayOf(             // array of objects with date and arbitrary metadata
    PropTypes.shape({
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    }).isRequired
  ).isRequired,
  numDays: PropTypes.number,             // number of days back from endDate to show
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),  // end of date range
  gutterSize: PropTypes.number,          // size of space between squares
  horizontal: PropTypes.bool,            // whether to orient horizontally or vertically
  showMonthLabels: PropTypes.bool,       // whether to show month labels
  showOutOfRangeDays: PropTypes.bool,    // whether to render squares for extra days in week after endDate, and before start date
  tooltipDataAttrs: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),    // data attributes to add to square for setting 3rd party tooltips, e.g. { 'data-toggle': 'tooltip' } for bootstrap tooltips
  titleForValue: PropTypes.func,         // function which returns title text for value
  classForValue: PropTypes.func,         // function which returns html class for value
  onClick: PropTypes.func,               // callback function when a square is clicked
};

CalendarHeatmap.defaultProps = {
  numDays: 200,
  endDate: new Date(),
  gutterSize: 1,
  horizontal: true,
  showMonthLabels: true,
  showOutOfRangeDays: false,
  classForValue: value => (value ? 'color-filled' : 'color-empty'),
  minColor: "#d6e685",
  maxColor: "#1e6823",
};

export default CalendarHeatmap;
