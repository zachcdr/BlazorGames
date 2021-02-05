function generatePieChart(data) {
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        // Create chart instance
        var chart = am4core.create("chartdiv", am4charts.PieChart);

        // Add and configure Series
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "total";
        pieSeries.dataFields.category = "userName";

        // Let's cut a hole in our Pie chart the size of 30% the radius
        chart.innerRadius = am4core.percent(30);

        // Put a thick white border around each Slice
        pieSeries.slices.template.stroke = am4core.color("#fff");
        pieSeries.slices.template.strokeWidth = 2;
        pieSeries.slices.template.strokeOpacity = 1;
        pieSeries.slices.template
            // change the cursor on hover to make it apparent the object can be interacted with
            .cursorOverStyle = [
                {
                    "property": "cursor",
                    "value": "pointer"
                }
            ];

        pieSeries.alignLabels = false;
        pieSeries.labels.template.bent = true;
        pieSeries.labels.template.radius = 3;
        pieSeries.labels.template.padding(0, 0, 0, 0);

        pieSeries.ticks.template.disabled = true;

        // Create a base filter effect (as if it's not there) for the hover to return to
        var shadow = pieSeries.slices.template.filters.push(new am4core.DropShadowFilter);
        shadow.opacity = 0;

        // Create hover state
        var hoverState = pieSeries.slices.template.states.getKey("hover"); // normally we have to create the hover state, in this case it already exists

        // Slightly shift the shadow and make it more prominent on hover
        var hoverShadow = hoverState.filters.push(new am4core.DropShadowFilter);
        hoverShadow.opacity = 0.7;
        hoverShadow.blur = 5;

        // Add a legend
        chart.legend = new am4charts.Legend();

        chart.data = data;

    }); // end am4core.ready()
}

function generateLineGraph(data) {
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        // Create chart instance
        var chart = am4core.create("chartdiv", am4charts.XYChart);

        // Add data
        chart.data = data;

        // Set input format for the dates
        chart.dateFormatter.inputDateFormat = "yyyy-MM-dd";

        // Create axes
        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

        // Create series
        var series = chart.series.push(new am4charts.LineSeries());
        series.dataFields.valueY = "value";
        series.dataFields.dateX = "date";
        series.tooltipText = "{value}";
        series.strokeWidth = 2;
        series.minBulletDistance = 15;

        // Drop-shaped tooltips
        series.tooltip.background.cornerRadius = 20;
        series.tooltip.background.strokeOpacity = 0;
        series.tooltip.pointerOrientation = "vertical";
        series.tooltip.label.minWidth = 40;
        series.tooltip.label.minHeight = 40;
        series.tooltip.label.textAlign = "middle";
        series.tooltip.label.textValign = "middle";

        // Make bullets grow on hover
        var bullet = series.bullets.push(new am4charts.CircleBullet());
        bullet.circle.strokeWidth = 2;
        bullet.circle.radius = 4;
        bullet.circle.fill = am4core.color("#fff");

        var bullethover = bullet.states.create("hover");
        bullethover.properties.scale = 1.3;

        // Make a panning cursor
        chart.cursor = new am4charts.XYCursor();
        chart.cursor.behavior = "panXY";
        chart.cursor.xAxis = dateAxis;
        chart.cursor.snapToSeries = series;

        // Create vertical scrollbar and place it before the value axis
        chart.scrollbarY = new am4core.Scrollbar();
        chart.scrollbarY.parent = chart.leftAxesContainer;
        chart.scrollbarY.toBack();

        // Create a horizontal scrollbar with previe and place it underneath the date axis
        chart.scrollbarX = new am4charts.XYChartScrollbar();
        chart.scrollbarX.series.push(series);
        chart.scrollbarX.parent = chart.bottomAxesContainer;

        dateAxis.start = 0.79;
        dateAxis.keepSelection = true;


    }); // end am4core.ready()
}

function volumeTimeStats(dailyStats, hourlyStats) {
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        // Create chart instance
        var chart = am4core.create("chartdiv", am4charts.XYChart);

        // Create daily series and related axes
        var dateAxis1 = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis1.renderer.grid.template.location = 0;
        dateAxis1.renderer.minGridDistance = 40;

        var valueAxis1 = chart.yAxes.push(new am4charts.ValueAxis());

        var series1 = chart.series.push(new am4charts.ColumnSeries());
        series1.dataFields.valueY = "value";
        series1.dataFields.dateX = "date";
        series1.data = dailyStats;
        series1.xAxis = dateAxis1;
        series1.yAxis = valueAxis1;
        series1.tooltipText = "{dateX}: [bold]{valueY}[/]";

        // Create hourly series and related axes
        var dateAxis2 = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis2.renderer.grid.template.location = 0;
        dateAxis2.renderer.minGridDistance = 40;
        dateAxis2.renderer.labels.template.disabled = true;
        dateAxis2.renderer.grid.template.disabled = true;
        dateAxis2.renderer.tooltip.disabled = true;

        var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis2.renderer.opposite = true;
        valueAxis2.renderer.grid.template.disabled = true;
        valueAxis2.renderer.labels.template.disabled = true;
        valueAxis2.renderer.tooltip.disabled = true;

        var series2 = chart.series.push(new am4charts.LineSeries());
        series2.dataFields.valueY = "value";
        series2.dataFields.dateX = "date";
        series2.data = generateHourlyData(hourlyStats);
        series2.xAxis = dateAxis2;
        series2.yAxis = valueAxis2;
        series2.strokeWidth = 3;
        series2.tooltipText = "{dateX.formatDate('yyyy-MM-dd hh:00')}: [bold]{valueY}[/]";

        // Add cursor
        chart.cursor = new am4charts.XYCursor();

        function generateHourlyData(stats) {
            var data = [];
            for (var i = 0; i < stats.length; i++) {
                var newDate = new Date(stats[i].date);
                data.push({
                    date: newDate,
                    value: stats[i].value
                });
            }
            return data;
        }

        // Create a horizontal scrollbar with previe and place it underneath the date axis
        chart.scrollbarX = new am4charts.XYChartScrollbar();
        chart.scrollbarX.series.push(series1);
        chart.scrollbarX.parent = chart.bottomAxesContainer;

        dateAxis1.start = 5.79;
        dateAxis1.keepSelection = true;

    }); // end am4core.ready()
}