#!/usr/bin/env python3
"""
Phase 2: Data Preprocessing
Clean city_day.csv data for time series forecasting
"""

import pandas as pd
import numpy as np
import os
import warnings

warnings.filterwarnings("ignore")

INPUT_PATH = "data/raw/city_day.csv"
OUTPUT_PATH = "data/processed/preprocessed_city_day.csv"

# Create directories if they don't exist
os.makedirs("data/processed", exist_ok=True)


def load_data():
    """Load the raw data"""
    print("Loading data...")
    df = pd.read_csv(INPUT_PATH)
    print(f"Loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    return df


def parse_dates(df):
    """Convert Date column to datetime"""
    print("\nParsing dates...")
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["City", "Date"]).reset_index(drop=True)
    print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
    return df


def filter_cities(df, min_days=500):
    """Filter cities with sufficient data"""
    print(f"\nFiltering cities with at least {min_days} days of data...")
    city_counts = df.groupby("City").size()
    valid_cities = city_counts[city_counts >= min_days].index
    df = df[df["City"].isin(valid_cities)].copy()
    print(f"Kept {len(valid_cities)} cities: {list(valid_cities)}")
    return df


def handle_missing(df):
    """Handle missing values with interpolation"""
    print("\nHandling missing values...")

    pollutants = [
        "PM2.5",
        "PM10",
        "NO",
        "NO2",
        "NOx",
        "NH3",
        "CO",
        "SO2",
        "O3",
        "Benzene",
        "Toluene",
        "Xylene",
        "AQI",
    ]

    initial_missing = df[pollutants].isnull().sum().sum()
    print(f"Initial missing values: {initial_missing}")

    for city in df["City"].unique():
        city_mask = df["City"] == city
        for col in pollutants:
            if col in df.columns:
                df.loc[city_mask, col] = df.loc[city_mask, col].interpolate(
                    method="linear"
                )
                df.loc[city_mask, col] = df.loc[city_mask, col].fillna(df[col].median())

    final_missing = df[pollutants].isnull().sum().sum()
    print(f"Final missing values: {final_missing}")

    # Handle AQI_Bucket
    df["AQI_Bucket"] = df["AQI_Bucket"].fillna("Unknown")

    return df


def handle_outliers(df, n_std=4):
    """Cap outliers using standard deviation method"""
    print("\nHandling outliers...")
    pollutants = ["PM2.5", "PM10", "NO", "NO2", "NOx", "NH3", "CO", "SO2", "O3", "AQI"]

    for col in pollutants:
        if col in df.columns:
            mean = df[col].mean()
            std = df[col].std()
            lower = mean - n_std * std
            upper = mean + n_std * std
            df[col] = df[col].clip(lower=max(0, lower), upper=upper)

    return df


def create_aqi_bucket(df):
    """Create AQI bucket from AQI values if missing"""
    print("\nCreating AQI buckets...")

    def categorize(aqi):
        if pd.isna(aqi):
            return "Unknown"
        elif aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Satisfactory"
        elif aqi <= 200:
            return "Moderate"
        elif aqi <= 300:
            return "Poor"
        elif aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"

    df["AQI_Bucket"] = df.apply(
        lambda x: x["AQI_Bucket"]
        if x["AQI_Bucket"] != "Unknown"
        else categorize(x["AQI"]),
        axis=1,
    )
    return df


def save_data(df):
    """Save preprocessed data"""
    print(f"\nSaving to {OUTPUT_PATH}...")
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Saved: {df.shape[0]} rows, {df.shape[1]} columns")

    # Summary
    print("\n" + "=" * 50)
    print("PREPROCESSING SUMMARY")
    print("=" * 50)
    print(f"Cities: {df['City'].nunique()}")
    print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
    print(f"Missing values: {df.isnull().sum().sum()}")
    print(f"\nAQI Bucket distribution:\n{df['AQI_Bucket'].value_counts()}")


def main():
    print("=" * 60)
    print("PHASE 2: DATA PREPROCESSING")
    print("=" * 60)

    df = load_data()
    df = parse_dates(df)
    df = filter_cities(df, min_days=500)
    df = handle_missing(df)
    df = handle_outliers(df)
    df = create_aqi_bucket(df)
    save_data(df)

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
