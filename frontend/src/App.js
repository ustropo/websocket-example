import './App.css';
import React from 'react';
import { AreaChart, CartesianGrid, Area, XAxis, YAxis } from 'recharts'


class App extends React.Component {


  constructor() {
    super()
    this.state = { data: [], count: 0, ws: null, indicatorColor:"yellow" }

  }

  timeout = 250; // Initial timeout duration as a class variable 

  componentDidMount() {
    this.connect();
  }

  /** @function connect
   * * This function establishes the connect with the websocket and also ensures constant reconnection if connection closes**/
  connect = () => {
    var ws = new WebSocket("ws://localhost:8000/ws");
    let that = this; // cache the this
    var connectInterval;

    ws.onmessage = this.onMessage

    

    // websocket onopen event listener
    ws.onopen = () => {
      console.log("connected websocket main component");
      this.setState({
        ws: ws,
        // Create an interval to send echo messages to the server
        interval: setInterval(() => ws.send('echo'), 1000),
        indicatorColor: "green"
      })

      that.timeout = 250; // reset timer to 250 on open of websocket connection 
      clearTimeout(connectInterval); // clear Interval on on open of websocket connection
    };

    // websocket onclose event listener
    ws.onclose = e => {
      console.log(
        `Socket is closed. Reconnect will be attempted in ${Math.min(
          10000 / 1000,
          (that.timeout + that.timeout) / 1000
        )} second.`,
        e.reason
      );

      this.setState({
        indicatorColor: "red"
      })
      
      that.timeout = that.timeout + that.timeout; //increment retry interval
      connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
    };

    // websocket onerror event listener
    ws.onerror = err => {
      console.error(
        "Socket encountered error: ",
        err.message,
        "Closing socket"
      );

      ws.close();
    };
  };

  /** utilized by the @function connect to check if the connection is close, if so attempts to reconnect
   */
  check = () => {
    const { ws } = this.state;
    if (!ws || ws.readyState == WebSocket.CLOSED) this.connect(); //check if websocket instance is closed, if so call `connect` function.
  };


  componentWillUnmount() {
    const { ws, interval } = this.state;
    ws.close()
    clearInterval(interval)
  }

  onMessage = (ev) => {
    const recv = JSON.parse(ev.data)
    const { data, count} = this.state
    let newData = [...data]
    console.log("new data inside onMessage:", newData)
    // Remove first data if we received more than 20 values
    if (count > 20) {
      newData = newData.slice(1)
    }
    newData.push({ value: recv.value, index: count })
    this.setState({ data: newData, count: count + 1 })
  }

  render() {

    return (
      <div className="App">
        <header className="App-header">
          <h2>
            WebSocket Example
          </h2>

          <div id="indicator" style={{backgroundColor: this.state.indicatorColor}}></div>
          

          <AreaChart width={900} height={600} data={this.state.data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#33ff33" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#33ff33" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="index" />
            <YAxis />
            <CartesianGrid stroke="#666" strokeDasharray="5 5" />
            <Area type="monotone" dataKey="value" stroke="#33ff33" fill="url(#colorValue)" isAnimationActive={false} />
          </AreaChart>
        </header>
      </div>
    )
  }
}

export default App;
