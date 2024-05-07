Programming Challenge: Pronto's Billion Row Challenge
---
Expected time frame: 1 week

# Problem statement

You've been assigned a project where you implement a rough full stack application to process real-time data and display that data on a webpage for *stakeholders*.
Live data is being published at a high rate from the above **Server URL** using [ZMQ](https://zeromq.org/) XPUB.

The **Problem** is assigned in 2 parts:

1. Write a backend storage solution to ingest this data. Key metrics are per `name` the mean, min, max of the measurement and the last known (Latitude, Longitude, and Heading).
    - You are free to write this in any language that you are comfortable with (Pronto mostly writes in Python and Javascript).
    - For *mean*, the value only needs to be accurate to one fractional digit.

2. Design a webpage to display the calculated metrics from Part 1.
    - You are free to use any technology in your toolbox to implement this (Pronto mostly uses React)
    - Since the number of unique `name` isn't fixed, display the top 10 sorted by maximum measurement descending. Display all the key metrics as explained in Part 1, along with the number of datapoints that each `name` has been calculated over.

Bonus. Visualize a `name` as its Latitude Longitude Heading change.
    - Animate a sprite as these values change
    - Design and implementation completely up to you.
    - Not doing this portion is not a penalty in anyway, but be prepared to explain approaches that you might take to implement this.

The programming challenge should take no more than 1 week. We will be discussing your solution and implementation at the end of the challenge; even if all the steps have not been completed.

## Data Format

Each data point is of the form:
```
<string: name>;<float: latitude>;<float: longitude>;<float: heading degrees>;<float: measurement>;<string: verification id>
```

### Specifics of Data

Each value of `float` is at most 999 with only one fractional digit. String values are at most length of 6. It is not readily known how many unique `name` will be published at any point - do not make assumptions that this number is constant.

### Subscribing

Subscribe to the data flow by opening a ZMQ subscriber and connecting to the **SERVER URL**.
applicant-README.txt
Displaying applicant-README.txt.