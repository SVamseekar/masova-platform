package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.service.SentimentAnalysisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("SentimentAnalysisService Unit Tests")
class SentimentAnalysisServiceTest {

    private final SentimentAnalysisService service = new SentimentAnalysisService();

    @Nested
    @DisplayName("analyzeSentiment")
    class AnalyzeSentiment {

        @Test
        @DisplayName("returns NEUTRAL for null text")
        void neutralForNull() {
            assertThat(service.analyzeSentiment(null)).isEqualTo(Review.SentimentType.NEUTRAL);
        }

        @Test
        @DisplayName("returns NEUTRAL for empty text")
        void neutralForEmpty() {
            assertThat(service.analyzeSentiment("   ")).isEqualTo(Review.SentimentType.NEUTRAL);
        }

        @Test
        @DisplayName("returns POSITIVE for strongly positive text")
        void positiveForPositiveText() {
            assertThat(service.analyzeSentiment("excellent amazing great wonderful fantastic delicious perfect outstanding"))
                    .isEqualTo(Review.SentimentType.POSITIVE);
        }

        @Test
        @DisplayName("returns NEGATIVE for strongly negative text")
        void negativeForNegativeText() {
            assertThat(service.analyzeSentiment("terrible awful bad worst horrible disgusting poor disappointing"))
                    .isEqualTo(Review.SentimentType.NEGATIVE);
        }

        @Test
        @DisplayName("returns MIXED for mixed positive/negative text")
        void mixedForMixedText() {
            // One positive, one negative — equal scores → MIXED
            assertThat(service.analyzeSentiment("excellent but terrible"))
                    .isEqualTo(Review.SentimentType.MIXED);
        }

        @Test
        @DisplayName("returns NEUTRAL for text with no keywords")
        void neutralForNoKeywords() {
            assertThat(service.analyzeSentiment("I ordered pizza on Tuesday"))
                    .isEqualTo(Review.SentimentType.NEUTRAL);
        }
    }

    @Nested
    @DisplayName("calculateSentimentScore")
    class CalculateSentimentScore {

        @Test
        @DisplayName("returns 0.0 for null text")
        void zeroForNull() {
            assertThat(service.calculateSentimentScore(null)).isEqualTo(0.0);
        }

        @Test
        @DisplayName("returns 0.0 for empty text")
        void zeroForEmpty() {
            assertThat(service.calculateSentimentScore("  ")).isEqualTo(0.0);
        }

        @Test
        @DisplayName("returns 0.0 for text with no keywords")
        void zeroForNoKeywords() {
            assertThat(service.calculateSentimentScore("I ordered on a Tuesday")).isEqualTo(0.0);
        }

        @Test
        @DisplayName("returns positive score for positive text")
        void positiveScore() {
            double score = service.calculateSentimentScore("excellent amazing great");
            assertThat(score).isGreaterThan(0.0);
        }

        @Test
        @DisplayName("returns negative score for negative text")
        void negativeScore() {
            double score = service.calculateSentimentScore("terrible awful bad");
            assertThat(score).isLessThan(0.0);
        }

        @Test
        @DisplayName("score is bounded between -1.0 and 1.0")
        void scoreBounded() {
            double score = service.calculateSentimentScore("excellent amazing great wonderful fantastic delicious perfect");
            assertThat(score).isBetween(-1.0, 1.0);
        }
    }

    @Nested
    @DisplayName("extractCommonThemes")
    class ExtractCommonThemes {

        @Test
        @DisplayName("returns empty list for empty input")
        void emptyForEmptyInput() {
            assertThat(service.extractCommonThemes(List.of())).isEmpty();
        }

        @Test
        @DisplayName("detects delivery time theme")
        void detectsDeliveryTheme() {
            List<String> themes = service.extractCommonThemes(List.of("Very late delivery, too slow"));
            assertThat(themes).contains("Delivery Time");
        }

        @Test
        @DisplayName("detects food quality theme")
        void detectsFoodQualityTheme() {
            List<String> themes = service.extractCommonThemes(List.of("Very fresh ingredients, great quality"));
            assertThat(themes).contains("Food Quality");
        }

        @Test
        @DisplayName("skips null and empty comments")
        void skipsNullAndEmpty() {
            assertThatCode(() -> service.extractCommonThemes(List.of("", "  ")))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("returns at most 5 themes")
        void returnsAtMostFive() {
            List<String> comments = List.of(
                    "spicy hot, slow late delay, cold temperature, price expensive, packaging presentation, service staff"
            );
            assertThat(service.extractCommonThemes(comments)).hasSizeLessThanOrEqualTo(5);
        }
    }

    @Nested
    @DisplayName("analyzeSentimentDistribution")
    class AnalyzeSentimentDistribution {

        @Test
        @DisplayName("returns map with all four keys")
        void returnsAllKeys() {
            Map<String, Long> dist = service.analyzeSentimentDistribution(List.of());
            assertThat(dist).containsKeys("POSITIVE", "NEGATIVE", "NEUTRAL", "MIXED");
        }

        @Test
        @DisplayName("counts reviews by sentiment type")
        void countsBySentiment() {
            Review r1 = new Review();
            r1.setSentiment(Review.SentimentType.POSITIVE);
            Review r2 = new Review();
            r2.setSentiment(Review.SentimentType.POSITIVE);
            Review r3 = new Review();
            r3.setSentiment(Review.SentimentType.NEGATIVE);
            Review r4 = new Review();
            // null sentiment — should be skipped

            Map<String, Long> dist = service.analyzeSentimentDistribution(List.of(r1, r2, r3, r4));

            assertThat(dist.get("POSITIVE")).isEqualTo(2L);
            assertThat(dist.get("NEGATIVE")).isEqualTo(1L);
            assertThat(dist.get("NEUTRAL")).isEqualTo(0L);
        }
    }
}
