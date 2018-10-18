/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    "use strict";

    interface BarchartViewModel
    {
        dataPoints: BarchartDataPoint[];
        dataMax: number;
    }

    interface BarchartDataPoint
    {
        value: PrimitiveValue;
        category: string;
    }

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarchartViewModel
    {
        let dataViews = options.dataViews;

        let dataInfo: BarchartViewModel = 
        {
            dataPoints: [],
            dataMax: 0
        };

        if(!dataViews 
            || !dataViews[0] 
            || !dataViews[0].categorical 
            || !dataViews[0].categorical.categories 
            || !dataViews[0].categorical.categories[0].source 
            || !dataViews[0].categorical.values)
            return dataInfo;

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];

        let dataPoints: BarchartDataPoint[] = [];
        let dataMax: number;

        for(let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++)
        {
            dataPoints.push({
                category: <string>category.values[i],
                value: dataValue.values[i]
            });
        }

        dataMax = <number>dataValue.maxLocal;

        return {
            dataPoints: dataPoints,
            dataMax: dataMax
        };
    }

    export class Visual implements IVisual {
        private host: IVisualHost;
        private svg: d3.Selection<SVGElement>;
        private barContainer: d3.Selection<SVGElement>;
        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.svg = d3.select(options.element)
            .append('svg')
            .classed('barchart', true);

            this.barContainer = this.svg
            .append('g')
            .classed('barContainer', true);
        }

        public update(options: VisualUpdateOptions) {
             let transformedData: BarchartViewModel = visualTransform(options, this.host);
             let width = options.viewport.width;
             let height = options.viewport.height;

             this.svg.attr({
                width: width,
                height: height
             });
             
             let yScale = d3.scale.linear()
             .domain([0, transformedData.dataMax])
             .range([height, 0]);

             let xScale = d3.scale.ordinal()
             .domain(transformedData.dataPoints.map(dataPoint => dataPoint.category))
             .rangeRoundBands([0, width], 0.1, 0.2);

             let bars = this.barContainer
                .selectAll('.bar')
                .data(transformedData.dataPoints);

                bars.enter()
                .append('rect')
                .classed('bar', true);
            bars.attr({
                width: xScale.rangeBand(),
                height: data => height - yScale(<number>data.value),
                x: data => xScale(data.category),
                y: data => yScale(<number>data.value)
            })

            bars.exit().remove();
        }

    }
}