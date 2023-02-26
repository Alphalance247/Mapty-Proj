'use strict';
const neewForem = document.querySelector('.form');
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _description() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._description();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._description();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speeed;
  }
}

/////////////////////////////////////////
//APPLICATION ARCHITECTURE

class App {
  #mapEvent;
  #map;
  #mapView = 13;
  #Workouts = [];

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    // this.reset();

    form.addEventListener('submit', this._newWorkOut.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get the real location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coord = [latitude, longitude];

    this.#map = L.map('map').setView(coord, this.#mapView);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#Workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
    form.classList.add('hidden');
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    const validInputs = (...inputs) =>
      inputs.every(value => Number.isFinite(value));

    const valid = (...inputs) => inputs.every(value => value > 0);

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let Workout;
    //if workout running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        !validInputs(distance, duration, cadence) ||
        !valid(distance, duration, cadence)
      )
        return alert('Inputs have to be positive');

      Workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if work-out cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !valid(distance, duration)
      )
        return alert('Inputs have to be positive');

      // console.log([lat, lng], distance, duration, elevation);

      Workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to workout array
    this.#Workouts.push(Workout);

    this._renderWorkoutMarker(Workout);

    this._renderWorkout(Workout);

    //Hide form + clear input fields
    this._hideForm();

    //Setting the local starage api
    this._setLocalStorage();
  }

  _renderWorkoutMarker(Workout) {
    //Render work out on map as marker

    L.marker(Workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${Workout.type}-popup`,
        })
      )
      .setPopupContent(
        ` ${Workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${Workout.description} `
      )
      .openPopup();
  }

  //Rendering workout on list

  _renderWorkout(Workout) {
    let html = `
    <li class="workout workout--${Workout.type}" data-id="${Workout.id}">
          <h2 class="workout__title">${Workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              Workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${Workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${Workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (Workout.type === 'running')
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${Workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    if (Workout.type === 'cycling')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${Workout.elevationGain} </span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  //Moving map to its actual position
  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#Workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapView, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
    // console.log(workout);
  }
  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#Workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    console.log(data);
    if (!data) return;
    this.#Workouts = data;

    this.#Workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  //Local storage reset
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();
