google.charts.load('current', {packages: ['corechart', 'line']});
google.charts.setOnLoadCallback(drawBackgroundColor);

function drawBackgroundColor() {
    $.get("/get-progress", {}, function(result) {
        console.log(result);
        {
            var data = new google.visualization.DataTable();
            data.addColumn('number', 'X');
            data.addColumn('number', 'Dogs');

            data.addRows(result);

            var options = {
                hAxis: {
                    title: 'Time'
                },
                vAxis: {
                    title: 'Popularity'
                },
                backgroundColor: '#f1f8e9'
            };

            var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
            chart.draw(data, options);
        }
        {
            var data = new google.visualization.DataTable();
            data.addColumn('number', 'X');
            data.addColumn('number', 'Dogs');

            data.addRows(result.splice(Math.max(0, result.length - 200)));

            var options = {
                hAxis: {
                    title: 'Time'
                },
                vAxis: {
                    title: 'Popularity'
                },
                backgroundColor: '#f1f8e9'
            };

            var chart = new google.visualization.LineChart(document.getElementById('chart_div2'));
            chart.draw(data, options);
        }
    });
}
