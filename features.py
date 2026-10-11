#!/usr/bin/env python3
"""
Phase 3: Feature Engineering
Create lag features, date features, and rolling statistics for time series
"""

import pandas as pd
import numpy as np
import pickle
import os
import warnings

warnings.filterwarnings("ignore")

INPUT_PATH = "data/processed/preprocessed_city_day.csv"
OUTPUT_PATH = "data/processed/features_city_day.csv"
CITY_MODEL_PATH = "models/city_model_data.pkl"

# Create directories if they don't exist
os.makedirs("data/processed", exist_ok=True)
os.makedirs("models", exist_ok=True)


def load_data():
    """Load preprocessed data"""
    print("Loading preprocessed data...")
    df = pd.read_csv(INPUT_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    print(f"Loaded: {df.shape[0]} rows")
    return df


def create_date_features(df):
    """Extract date-based features"""
    print("\nCreating date features...")
    df["Year"] = df["Date"].dt.year
    df["Month"] = df["Date"].dt.month
    df["Day"] = df["Date"].dt.day
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["DayOfYear"] = df["Date"].dt.dayofyear
    df["WeekOfYear"] = df["Date"].dt.isocalendar().week.astype(int)
    df["Quarter"] = df["Date"].dt.quarter

    # Season
    def get_season(month):
        if month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        elif month in [9, 10, 11]:
            return "Autumn"
        else:
            return "Winter"

    df["Season"] = df["Month"].apply(get_season)

    # Weekend flag
    df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)

    return df


def create_lag_features(df, target_col="AQI", lags=[1, 2, 3, 7, 14, 30]):
    """Create lag features for the target variable"""
    print(f"\nCreating lag features for {target_col}...")
    df = df.sort_values(["City", "Date"])

    for lag in lags:
        df[f"{target_col}_lag_{lag}"] = df.groupby("City")[target_col].shift(lag)

    return df


def create_rolling_features(df, target_col="AQI", windows=[7, 14, 30]):
    """Create rolling window statistics"""
    print(f"\nCreating rolling features for {target_col}...")
    df = df.sort_values(["City", "Date"])

    for window in windows:
        df[f"{target_col}_rolling_mean_{window}"] = df.groupby("City")[
            target_col
        ].transform(lambda x: x.shift(1).rolling(window=window, min_periods=1).mean())
        df[f"{target_col}_rolling_std_{window}"] = df.groupby("City")[
            target_col
        ].transform(lambda x: x.shift(1).rolling(window=window, min_periods=1).std())

    return df


def create_pollutant_lag_features(df, lags=[1, 7]):
    """Create lag features for pollutant columns"""
    print("\nCreating pollutant lag features...")
    pollutants = ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3"]

    for pollutant in pollutants:
        if pollutant in df.columns:
            for lag in lags:
                df[f"{pollutant}_lag_{lag}"] = df.groupby("City")[pollutant].shift(lag)

    return df


def create_expanding_features(df, target_col="AQI"):
    """Create expanding mean features"""
    print(f"\nCreating expanding features for {target_col}...")
    df = df.sort_values(["City", "Date"])

    df[f"{target_col}_expanding_mean"] = df.groupby("City")[target_col].transform(
        lambda x: x.shift(1).expanding(min_periods=1).mean()
    )

    return df


def encode_categorical(df):
    """Encode categorical variables"""
    print("\nEncoding categorical variables...")

    # Season encoding
    season_map = {"Spring": 0, "Summer": 1, "Autumn": 2, "Winter": 3}
    df["Season_encoded"] = df["Season"].map(season_map)

    # City encoding
    city_map = {city: i for i, city in enumerate(sorted(df["City"].unique()))}
    df["City_encoded"] = df["City"].map(city_map)

    # Save encoders
    encoders = {"season": season_map, "city": city_map}
    with open("models/encoders.pkl", "wb") as f:
        pickle.dump(encoders, f)
    print("Saved encoders to models/encoders.pkl")

    return df


def create_city_model_data(df, city="Delhi"):
    """Prepare data for city-specific model"""
    print(f"\nPreparing city-specific data for {city}...")
    city_df = df[df["City"] == city].copy()
    city_df = city_df.sort_values("Date").reset_index(drop=True)

    # Drop rows with NaN in lag features
    city_df = city_df.dropna()

    # Define feature columns
    feature_cols = [
        "Year",
        "Month",
        "Day",
        "DayOfWeek",
        "Quarter",
        "IsWeekend",
        "Season_encoded",
        "AQI_lag_1",
        "AQI_lag_2",
        "AQI_lag_3",
        "AQI_lag_7",
        "AQI_lag_14",
        "AQI_lag_30",
        "AQI_rolling_mean_7",
        "AQI_rolling_mean_14",
        "AQI_rolling_mean_30",
        "PM2.5_lag_1",
        "PM2.5_lag_7",
        "PM10_lag_1",
        "PM10_lag_7",
    ]

    # Filter to available columns
    feature_cols = [c for c in feature_cols if c in city_df.columns]

    X = city_df[feature_cols]
    y = city_df["AQI"]

    print(f"Features shape: {X.shape}")
    print(f"Target shape: {y.shape}")

    return X, y, feature_cols


def save_data(df, X, y, feature_cols):
    """Save processed data"""
    print(f"\nSaving to {OUTPUT_PATH}...")
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved full dataset: {df.shape}")

    # Save city model data
    city_data = {"X": X, "y": y, "feature_cols": feature_cols}
    with open(CITY_MODEL_PATH, "wb") as f:
        pickle.dump(city_data, f)
    print(f"Saved city model data to {CITY_MODEL_PATH}")


def main():
    print("=" * 60)
    print("PHASE 3: FEATURE ENGINEERING")
    print("=" * 60)

    df = load_data()
    df = create_date_features(df)
    df = create_lag_features(df, target_col="AQI", lags=[1, 2, 3, 7, 14, 30])
    df = create_rolling_features(df, target_col="AQI", windows=[7, 14, 30])
    df = create_pollutant_lag_features(df, lags=[1, 7])
    df = create_expanding_features(df, target_col="AQI")
    df = encode_categorical(df)

    X, y, feature_cols = create_city_model_data(df, city="Delhi")
    save_data(df, X, y, feature_cols)

    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
