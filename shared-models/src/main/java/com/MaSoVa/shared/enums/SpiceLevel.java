package com.MaSoVa.shared.enums;

public enum SpiceLevel {
    NONE("No Spice", 0),
    MILD("Mild", 1),
    MEDIUM("Medium", 2),
    HOT("Hot", 3),
    EXTRA_HOT("Extra Hot", 4);

    private final String displayName;
    private final int level;

    SpiceLevel(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getLevel() {
        return level;
    }
}
