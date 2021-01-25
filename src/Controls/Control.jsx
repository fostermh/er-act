import React from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"

// we are importing some of the beautiful semantic UI react components
import {
  Segment,
  Input,
  Divider,
  Button,
  List,
  Grid,
  Icon
} from "semantic-ui-react"

// here are our first two actions, we will be adding them in the next step, bear with me!
import {
  updateErddapInput,
  fetchErddapData,
} from "../actions/actions"

// some inline styles (we should move these to our index.css at one stage)
const segmentStyle = {
  zIndex: 999,
  position: "absolute",
  width: "400px",
  top: "10px",
  left: "10px",
  maxHeight: "calc(100vh - 5vw)",
  overflow: "auto",
  padding: "20px"
};

class Control extends React.Component {
  static propTypes = {
    erddapInput: PropTypes.string.isRequired,
    erddapResults: PropTypes.array.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }

  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  handleInputChange = event => {
    const { dispatch } = this.props;

    dispatch(
        updateErddapInput({
            inputValue: event.target.value
        })
    )
  }

  handleAddErddap = () => {
    const { dispatch, erddapInput } = this.props
    // If the text input has more then 0 characters..
    console.log(erddapInput)
    if (erddapInput.length > 0) {

      dispatch(
        fetchErddapData({
          inputValue: erddapInput
        })
      )
    }
  };

  getErddapURLs = () => {
    const {erddapResults} = this.props
    if( erddapResults.length > 0){
      return erddapResults.map( x => x.name)
    }
  }

  render() {
    // The following constants are used in our search input which is also a semanticUI react component <Search... />
    const {
      isFetching,
      erddapInput
    } = this.props;

    return (
      <div>

        <Segment style={segmentStyle}>
          <div>
            <span>
              ERDDAP
            </span>
          </div>
          <Divider />

          <Grid>
            <Grid.Row columns={2}>
              <Grid.Column width={13}>
                <Input 
                  compact
                  loading={isFetching}
                  value={erddapInput}
                  onChange={this.handleInputChange}
                  style={{ width: "100%" }}
                />
              </Grid.Column>
              <Grid.Column width={3}>
                <Button 
                  icon
                  compact
                  onClick={this.handleAddErddap}
                >
                  <Icon 
                    name='plus square' 
                    size='large' 
                    color='black'
                  />
                </Button>
              </Grid.Column>
              
            </Grid.Row>
            <Grid.Row columns={1}>
              <Grid.Column width={16}>
                <List items={this.getErddapURLs()} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment> 
            
      </div>
    )
  }
}

//
const mapStateToProps = state => {
  const erddapInput = state.isochronesControls.erddapInput
  const isFetching = state.isochronesControls.isFetching
  const erddapResults = state.isochronesControls.erddapResults
  return {
    erddapInput,
    isFetching,
    erddapResults,
  }
}

export default connect(mapStateToProps)(Control)