# Insightful Energy

Energy monitor program, originally created in 2014 for [Myron B. Thompson Academy](http://ethompson.org/).
Upload data export files from a WeMo Insight Smart Plug and see the data charted out.

In my high school electricity class, we were manually aggregating data from
various energy monitor devices in Excel. I volunteered to create a tool to
automatically import the data and create interactive charts so the class could
focus on analyzing the data instead.

I used a CSV parser and the Javascript FileReader API to parse reports from
Belkin WeMo Insight Switch devices and a TED (The Energy Detective) monitor.
With the tool, we were able to easily pinpoint odd energy fluctuations, such
as the copy machine strangely turning on at 4am.

The app supports various filters for the charts, such as only showing working
hours. The average energy usage from multiple reports is calculated and
displayed with a prominent bold black line.

I extracted some of the parser code and turned it into a more generic
library, [wemo-chart](https://github.com/NotWoods/wemo-chart).

The app has since been updated to run offline as a Progressive Web App.
