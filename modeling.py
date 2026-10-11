#!/usr/bin/env python3
"""
Phase 4: Model Training
Train and compare ARIMA, XGBoost, and Prophet models
"""

import pandas as pd
import numpy as np
import pickle
import warnings

warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# Try to import optional libraries
try:
    from statsmodels.tsa.arima.model import ARIMA

    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False
    print("statsmodels not available, skipping ARIMA")

try:
    from prophet import Prophet

    HAS_PROPHET = True
except ImportError:
    HAS_PROPHET = False
    print("prophet not available, skipping Prophet")

try:
    import xgboost as xgb

    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("xgboost not available")

try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from sklearn.preprocessing import MinMaxScaler

    HAS_LSTM = True
except ImportError:
    HAS_LSTM = False
    print("tensorflow/keras not available, skipping LSTM")

INPUT_PATH = "data/processed/preprocessed_city_day.csv"
MODEL_PATH = "models/"


def load_data():
    """Load preprocessed data"""
    print("Loading data...")
    df = pd.read_csv(INPUT_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["City", "Date"]).reset_index(drop=True)
    print(f"Loaded: {df.shape[0]} rows")
    return df


def prepare_city_data(df, city="Delhi"):
    """Prepare city-specific time series data"""
    print(f"\nPreparing data for {city}...")
    city_df = df[df["City"] == city].copy()
    city_df = city_df.sort_values("Date").reset_index(drop=True)
    city_df = city_df.set_index("Date")
    return city_df


def create_features(df, target_col="AQI"):
    """Create lag and rolling features"""
    df = df.copy()
    df = df.reset_index()

    for lag in [1, 2, 3, 7, 14]:
        df[f"{target_col}_lag_{lag}"] = df[target_col].shift(lag)

    for window in [7, 14, 30]:
        df[f"{target_col}_rolling_{window}"] = (
            df[target_col].shift(1).rolling(window).mean()
        )

    df["Month"] = df["Date"].dt.month
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["Season"] = df["Date"].dt.month.apply(
        lambda m: 0
        if m in [3, 4, 5]
        else 1
        if m in [6, 7, 8]
        else 2
        if m in [9, 10, 11]
        else 3
    )

    df = df.dropna()
    return df


def train_arima(df, city="Delhi"):
    """Train ARIMA model"""
    if not HAS_STATSMODELS:
        return None, None, None

    print("\n--- Training ARIMA ---")
    ts = df["AQI"].values
    train_size = int(len(ts) * 0.8)
    train, test = ts[:train_size], ts[train_size:]

    try:
        model = ARIMA(train, order=(5, 1, 2))
        model_fit = model.fit()

        # Forecast
        predictions = model_fit.forecast(steps=len(test))

        # Metrics
        mae = mean_absolute_error(test, predictions)
        rmse = np.sqrt(mean_squared_error(test, predictions))

        print(f"ARIMA - MAE: {mae:.2f}, RMSE: {rmse:.2f}")

        return model_fit, {"MAE": mae, "RMSE": rmse}, predictions
    except Exception as e:
        print(f"ARIMA failed: {e}")
        return None, None, None


def train_xgboost(df, city="Delhi", target_col="AQI"):
    """Train XGBoost model"""
    if not HAS_XGBOOST:
        return None, None, None

    print(f"\n--- Training XGBoost for {target_col} ---")

    df_feat = create_features(df, target_col=target_col)

    feature_cols = [
        c
        for c in df_feat.columns
        if c not in [target_col, "Date", "City", "AQI_Bucket"]
    ]

    X = df_feat[feature_cols]
    y = df_feat[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model = xgb.XGBRegressor(
        n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print(f"XGBoost ({target_col}) - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.2f}")

    # Feature importance
    importance = pd.DataFrame(
        {"feature": feature_cols, "importance": model.feature_importances_}
    ).sort_values("importance", ascending=False)
    print(f"\nTop 5 features:")
    print(importance.head())

    return (
        model,
        {"MAE": mae, "RMSE": rmse, "R2": r2, "feature_cols": feature_cols},
        predictions,
    )


def train_prophet(df, city="Delhi"):
    """Train Prophet model"""
    if not HAS_PROPHET:
        return None, None, None

    print("\n--- Training Prophet ---")

    df_prophet = df.reset_index()[["Date", "AQI"]].rename(
        columns={"Date": "ds", "AQI": "y"}
    )

    train_size = int(len(df_prophet) * 0.8)
    train = df_prophet[:train_size]
    test = df_prophet[train_size:]

    try:
        model = Prophet(
            yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False
        )
        model.fit(train)

        future = model.make_future_dataframe(periods=len(test))
        forecast = model.predict(future)

        predictions = forecast["yhat"].values[-len(test) :]

        mae = mean_absolute_error(test["y"], predictions)
        rmse = np.sqrt(mean_squared_error(test["y"], predictions))

        print(f"Prophet - MAE: {mae:.2f}, RMSE: {rmse:.2f}")

        return model, {"MAE": mae, "RMSE": rmse}, predictions
    except Exception as e:
        print(f"Prophet failed: {e}")
        return None, None, None


def train_lstm(df, city="Delhi", look_back=14):
    """Train LSTM model"""
    if not HAS_LSTM:
        return None, None, None

    print("\n--- Training LSTM ---")

    df_reset = df.reset_index()
    data = df_reset[["AQI"]].values

    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)

    X, y = [], []
    for i in range(look_back, len(data_scaled)):
        X.append(data_scaled[i - look_back : i, 0])
        y.append(data_scaled[i, 0])

    X, y = np.array(X), np.array(y)
    X = X.reshape(X.shape[0], X.shape[1], 1)

    train_size = int(len(X) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]

    try:
        model = Sequential(
            [
                LSTM(50, return_sequences=True, input_shape=(look_back, 1)),
                Dropout(0.2),
                LSTM(50),
                Dropout(0.2),
                Dense(1),
            ]
        )
        model.compile(optimizer="adam", loss="mse")
        model.fit(X_train, y_train, epochs=20, batch_size=32, verbose=0)

        predictions_scaled = model.predict(X_test)
        predictions = scaler.inverse_transform(predictions_scaled)
        y_test_orig = scaler.inverse_transform(y_test.reshape(-1, 1))

        mae = mean_absolute_error(y_test_orig, predictions)
        rmse = np.sqrt(mean_squared_error(y_test_orig, predictions))

        print(f"LSTM - MAE: {mae:.2f}, RMSE: {rmse:.2f}")

        return (
            model,
            {"MAE": mae, "RMSE": rmse, "scaler": scaler, "look_back": look_back},
            predictions,
        )
    except Exception as e:
        print(f"LSTM failed: {e}")
        return None, None, None


def train_prophet_pollutant(df, pollutant="PM2.5"):
    """Train Prophet model for a pollutant"""
    if not HAS_PROPHET:
        return None, None, None

    df_prophet = df.reset_index()[["Date", pollutant]].rename(
        columns={"Date": "ds", pollutant: "y"}
    )

    train_size = int(len(df_prophet) * 0.8)
    train = df_prophet[:train_size]
    test = df_prophet[train_size:]

    try:
        model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
        model.fit(train)

        future = model.make_future_dataframe(periods=len(test))
        forecast = model.predict(future)

        predictions = forecast["yhat"].values[-len(test) :]

        mae = mean_absolute_error(test["y"], predictions)
        rmse = np.sqrt(mean_squared_error(test["y"], predictions))

        print(f"Prophet ({pollutant}) - MAE: {mae:.2f}, RMSE: {rmse:.2f}")

        return model, {"MAE": mae, "RMSE": rmse}, predictions
    except Exception as e:
        print(f"Prophet ({pollutant}) failed: {e}")
        return None, None, None


def train_pollutant_models(df, pollutant="PM2.5"):
    """Train models for a specific pollutant"""
    print(f"\n=== Training models for {pollutant} ===")

    df_reset = df.reset_index()
    if pollutant not in df_reset.columns:
        print(f"{pollutant} not found in data")
        return None

    df_poll = df_reset[["Date", pollutant]].dropna()
    if len(df_poll) < 100:
        print(f"Insufficient data for {pollutant}")
        return None

    df_poll = df_poll.set_index("Date")
    results = {}

    if HAS_XGBOOST:
        model, metrics, _ = train_xgboost(df_poll, pollutant, target_col=pollutant)
        results["XGBoost"] = metrics

    if HAS_PROPHET:
        model, metrics, _ = train_prophet_pollutant(df_poll, pollutant)
        results["Prophet"] = metrics

    return results


def compare_models(results):
    """Compare all models"""
    print("\n" + "=" * 50)
    print("MODEL COMPARISON")
    print("=" * 50)

    best_model = None
    best_rmse = float("inf")

    for model_name, metrics in results.items():
        if metrics:
            print(f"\n{model_name}:")
            print(f"  MAE: {metrics.get('MAE', 'N/A'):.2f}")
            print(f"  RMSE: {metrics.get('RMSE', 'N/A'):.2f}")
            if "R2" in metrics:
                print(f"  R2: {metrics.get('R2', 'N/A'):.2f}")

            if metrics.get("RMSE", float("inf")) < best_rmse:
                best_rmse = metrics["RMSE"]
                best_model = model_name

    print(f"\n*** Best Model: {best_model} (RMSE: {best_rmse:.2f}) ***")
    return best_model


def save_models(models, results):
    """Save trained models"""
    import os

    os.makedirs(MODEL_PATH, exist_ok=True)

    # Save XGBoost model
    if "XGBoost" in models and models["XGBoost"]:
        with open(f"{MODEL_PATH}xgboost_model.pkl", "wb") as f:
            pickle.dump(models["XGBoost"], f)
        with open(f"{MODEL_PATH}xgboost_features.pkl", "wb") as f:
            pickle.dump(results["XGBoost"]["feature_cols"], f)
        print(f"Saved XGBoost model to {MODEL_PATH}xgboost_model.pkl")

    # Save ARIMA model
    if "ARIMA" in models and models["ARIMA"]:
        with open(f"{MODEL_PATH}arima_model.pkl", "wb") as f:
            pickle.dump(models["ARIMA"], f)
        print(f"Saved ARIMA model to {MODEL_PATH}arima_model.pkl")

    # Save Prophet model
    if "Prophet" in models and models["Prophet"]:
        try:
            models["Prophet"].save_model(f"{MODEL_PATH}prophet_model.json")
            print(f"Saved Prophet model to {MODEL_PATH}prophet_model.json")
        except:
            # Save using pickle as fallback
            with open(f"{MODEL_PATH}prophet_model.pkl", "wb") as f:
                pickle.dump(models["Prophet"], f)
            print(f"Saved Prophet model to {MODEL_PATH}prophet_model.pkl")


def main():
    print("=" * 60)
    print("PHASE 4: MODEL TRAINING")
    print("=" * 60)

    df = load_data()
    city_df = prepare_city_data(df, city="Delhi")

    models = {}
    results = {}

    # Train AQI models
    print("\n" + "=" * 50)
    print("TRAINING AQI MODELS")
    print("=" * 50)

    # Train models
    if HAS_STATSMODELS:
        model, metrics, preds = train_arima(city_df, "Delhi")
        models["ARIMA"] = model
        results["ARIMA"] = metrics

    if HAS_XGBOOST:
        model, metrics, preds = train_xgboost(city_df, "Delhi")
        models["XGBoost"] = model
        results["XGBoost"] = metrics

    if HAS_PROPHET:
        model, metrics, preds = train_prophet(city_df, "Delhi")
        models["Prophet"] = model
        results["Prophet"] = metrics

    if HAS_LSTM:
        model, metrics, preds = train_lstm(city_df, "Delhi")
        models["LSTM"] = model
        results["LSTM"] = metrics

    # Train pollutant models (PM2.5, PM10)
    print("\n" + "=" * 50)
    print("TRAINING POLLUTANT MODELS")
    print("=" * 50)

    pollutants = ["PM2.5", "PM10"]
    pollutant_results = {}
    for poll in pollutants:
        poll_results = train_pollutant_models(city_df, poll)
        if poll_results:
            pollutant_results[poll] = poll_results

    # Compare and save
    best = compare_models(results)
    save_models(models, results)

    # Save pollutant results
    with open(f"{MODEL_PATH}pollutant_results.pkl", "wb") as f:
        pickle.dump(pollutant_results, f)
    print(f"Saved pollutant results to {MODEL_PATH}pollutant_results.pkl")

    print("\n" + "=" * 60)
    print("MODEL TRAINING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
