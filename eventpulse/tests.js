/* ============================================================
   EventPulse — Test Suite
   Self-executing unit tests for all utility and logic functions
   ============================================================ */

/**
 * Comprehensive test suite for EventPulse utility functions
 * Run by opening tests.html or calling TestSuite.runAll()
 * @namespace TestSuite
 */
const TestSuite = {

  /**
   * Test 1: Input sanitization removes script tags
   * Verifies XSS protection in the sanitizeInput function
   */
  testSanitizeInput: () => {
    const dirty = '<script>alert("xss")</script>Hello';
    const clean = sanitizeInput(dirty);
    assert(clean === 'Hello', 'sanitizeInput should strip script tags');
  },

  /**
   * Test 2: Sanitization removes all HTML tags
   * Ensures no HTML elements pass through
   */
  testSanitizeInputHtmlTags: () => {
    const dirty = '<div><b>Bold</b></div>';
    const clean = sanitizeInput(dirty);
    assert(clean === 'Bold', 'sanitizeInput should strip all HTML tags');
  },

  /**
   * Test 3: Sanitization handles empty and null input
   * Edge case: non-string inputs return empty string
   */
  testSanitizeInputEdgeCases: () => {
    assert(sanitizeInput('') === '', 'Empty string should return empty');
    assert(sanitizeInput(null) === '', 'Null should return empty');
    assert(sanitizeInput(undefined) === '', 'Undefined should return empty');
    assert(sanitizeInput(42) === '', 'Number should return empty');
  },

  /**
   * Test 4: Cache returns null after TTL expires
   * Verifies time-based cache expiration
   */
  testCacheExpiry: async () => {
    const testCache = new CacheManager();
    testCache.set('test_key', 'value', 0.001);
    await sleep(50);
    assert(testCache.get('test_key') === null, 'Cache should expire after TTL');
  },

  /**
   * Test 5: Cache returns value before TTL expires
   * Verifies cache hit within valid window
   */
  testCacheHit: () => {
    const testCache = new CacheManager();
    testCache.set('valid_key', 'valid_value', 60);
    assert(testCache.get('valid_key') === 'valid_value', 'Cache should return value before expiry');
  },

  /**
   * Test 6: Cache returns null for missing keys
   * Verifies cache miss behavior
   */
  testCacheMiss: () => {
    const testCache = new CacheManager();
    assert(testCache.get('nonexistent') === null, 'Missing key should return null');
  },

  /**
   * Test 7: Cache delete removes entry
   * Verifies manual cache invalidation
   */
  testCacheDelete: () => {
    const testCache = new CacheManager();
    testCache.set('del_key', 'del_value', 60);
    testCache.delete('del_key');
    assert(testCache.get('del_key') === null, 'Deleted key should return null');
  },

  /**
   * Test 8: Cache clear empties all entries
   * Verifies full cache purge
   */
  testCacheClear: () => {
    const testCache = new CacheManager();
    testCache.set('key1', 'val1', 60);
    testCache.set('key2', 'val2', 60);
    testCache.clear();
    assert(testCache.get('key1') === null, 'All keys should be cleared');
    assert(testCache.get('key2') === null, 'All keys should be cleared');
  },

  /**
   * Test 9: Crowd level color mapping — Low
   * Verifies green color for low crowd
   */
  testCrowdLevelColorLow: () => {
    assert(getCrowdColor('Low') === '#4CAF50', 'Low crowd should be green');
  },

  /**
   * Test 10: Crowd level color mapping — Medium
   * Verifies amber color for medium crowd
   */
  testCrowdLevelColorMedium: () => {
    assert(getCrowdColor('Medium') === '#FFB300', 'Medium crowd should be amber');
  },

  /**
   * Test 11: Crowd level color mapping — High
   * Verifies orange color for high crowd
   */
  testCrowdLevelColorHigh: () => {
    assert(getCrowdColor('High') === '#FF7043', 'High crowd should be orange');
  },

  /**
   * Test 12: Crowd level color mapping — Full
   * Verifies red color for full crowd
   */
  testCrowdLevelColorFull: () => {
    assert(getCrowdColor('Full') === '#F44336', 'Full crowd should be red');
  },

  /**
   * Test 13: Crowd level color mapping — Unknown
   * Verifies fallback color for unknown input
   */
  testCrowdLevelColorUnknown: () => {
    assert(getCrowdColor('Unknown') === '#6e6e99', 'Unknown crowd should be gray fallback');
  },

  /**
   * Test 14: Time formatting — AM conversion
   * Verifies 24hr to 12hr AM format
   */
  testFormatTimeAM: () => {
    assert(formatTime('09:00') === '9:00 AM', 'Should format 24hr to 12hr AM');
  },

  /**
   * Test 15: Time formatting — PM conversion
   * Verifies 24hr to 12hr PM format
   */
  testFormatTimePM: () => {
    assert(formatTime('14:30') === '2:30 PM', 'Should convert PM correctly');
  },

  /**
   * Test 16: Time formatting — Noon
   * Verifies 12:00 shows as 12:00 PM
   */
  testFormatTimeNoon: () => {
    assert(formatTime('12:00') === '12:00 PM', 'Noon should be 12:00 PM');
  },

  /**
   * Test 17: Time formatting — Midnight
   * Verifies 00:00 shows as 12:00 AM
   */
  testFormatTimeMidnight: () => {
    assert(formatTime('00:00') === '12:00 AM', 'Midnight should be 12:00 AM');
  },

  /**
   * Test 18: Attendee profile validation — empty fields
   * Verifies empty profile fails validation
   */
  testProfileValidationEmpty: () => {
    const empty = validateProfile({ name: '', role: '', interests: '' });
    assert(empty.isValid === false, 'Empty profile should fail validation');
    assert(empty.errors.length === 3, 'Should have 3 errors for all empty fields');
  },

  /**
   * Test 19: Attendee profile validation — valid profile
   * Verifies complete profile passes validation
   */
  testProfileValidationValid: () => {
    const valid = validateProfile({
      name: 'John Doe',
      role: 'Developer',
      interests: 'AI, Cloud'
    });
    assert(valid.isValid === true, 'Valid profile should pass validation');
    assert(valid.errors.length === 0, 'Should have no errors');
  },

  /**
   * Test 20: Attendee profile validation — partial
   * Verifies partially filled profile catches missing fields
   */
  testProfileValidationPartial: () => {
    const partial = validateProfile({
      name: 'Jane',
      role: '',
      interests: 'ML'
    });
    assert(partial.isValid === false, 'Partial profile should fail');
    assert(partial.errors.length === 1, 'Should have 1 error for missing role');
  },

  /**
   * Test 21: Onboarding validation — all empty
   * Verifies all fields required for onboarding
   */
  testOnboardingValidationEmpty: () => {
    const result = validateOnboarding({ role: '', interests: '', goal: '' });
    assert(result.isValid === false, 'Empty onboarding should fail');
    assert(Object.keys(result.errors).length === 3, 'Should have 3 field errors');
  },

  /**
   * Test 22: Onboarding validation — valid
   * Verifies complete onboarding passes
   */
  testOnboardingValidationValid: () => {
    const result = validateOnboarding({
      role: 'developer',
      interests: 'AI',
      goal: 'learn'
    });
    assert(result.isValid === true, 'Valid onboarding should pass');
  },

  /**
   * Test 23: Feedback validation — no session
   * Verifies session selection required
   */
  testFeedbackValidationNoSession: () => {
    const result = validateFeedback({ sessionId: '', rating: 4, comment: '' });
    assert(result.isValid === false, 'Feedback without session should fail');
  },

  /**
   * Test 24: Feedback validation — no rating
   * Verifies rating required
   */
  testFeedbackValidationNoRating: () => {
    const result = validateFeedback({ sessionId: 's1', rating: 0, comment: '' });
    assert(result.isValid === false, 'Feedback without rating should fail');
  },

  /**
   * Test 25: Feedback validation — valid
   * Verifies complete feedback passes
   */
  testFeedbackValidationValid: () => {
    const result = validateFeedback({
      sessionId: 's1',
      rating: 5,
      comment: 'Great session!'
    });
    assert(result.isValid === true, 'Valid feedback should pass');
  },

  /**
   * Test 26: Text truncation
   * Verifies text is truncated with ellipsis
   */
  testTruncateText: () => {
    const long = 'This is a very long text that should be truncated';
    const truncated = truncateText(long, 20);
    assert(truncated === 'This is a very long ...', 'Should truncate with ellipsis');
    assert(truncated.length === 23, 'Truncated length should be max + 3');
  },

  /**
   * Test 27: Text truncation — short text unchanged
   * Verifies short text passes through unchanged
   */
  testTruncateTextShort: () => {
    const short = 'Hello';
    assert(truncateText(short, 20) === 'Hello', 'Short text should not be truncated');
  },

  /**
   * Test 28: Initials generation
   * Verifies correct initials from full name
   */
  testGetInitials: () => {
    assert(getInitials('John Doe') === 'JD', 'Should get JD from John Doe');
    assert(getInitials('Jane') === 'J', 'Should get J from single name');
    assert(getInitials('') === '?', 'Empty name should return ?');
    assert(getInitials(null) === '?', 'Null name should return ?');
  },

  /**
   * Test 29: Rating labels
   * Verifies human-readable labels for ratings
   */
  testGetRatingLabel: () => {
    assert(getRatingLabel(1) === 'Poor', '1 star should be Poor');
    assert(getRatingLabel(3) === 'Good', '3 stars should be Good');
    assert(getRatingLabel(5) === 'Excellent', '5 stars should be Excellent');
    assert(getRatingLabel(0) === 'No rating selected', '0 should be no rating');
  },

  /**
   * Test 30: Crowd level modifier mapping
   * Verifies CSS class modifiers for crowd levels
   */
  testCrowdModifier: () => {
    assert(getCrowdModifier('Low') === 'low', 'Low should map to low');
    assert(getCrowdModifier('Full') === 'full', 'Full should map to full');
    assert(getCrowdModifier('Unknown') === 'low', 'Unknown should default to low');
  },

  /**
   * Test 31: Crowd data parsing
   * Verifies parsing of raw crowd data rows
   */
  testParseCrowdData: () => {
    const data = [['s1', 'High', '280'], ['s2', 'Low', '30']];
    const result = parseCrowdData(data, 's1');
    assert(result.level === 'High', 'Should parse correct level');
    assert(result.count === 280, 'Should parse correct count');
  },

  /**
   * Test 32: Crowd data parsing — missing session
   * Verifies fallback for missing session ID
   */
  testParseCrowdDataMissing: () => {
    const data = [['s1', 'High', '280']];
    const result = parseCrowdData(data, 's99');
    assert(result.level === 'Low', 'Missing session should default to Low');
    assert(result.count === 0, 'Missing session should default to 0 count');
  },

  /**
   * Test 33: Announcement parsing
   * Verifies parsing of announcement data rows
   */
  testParseAnnouncements: () => {
    const data = [['a1', 'Test announcement', '10:00', 'true']];
    const result = parseAnnouncements(data);
    assert(result.length === 1, 'Should parse one announcement');
    assert(result[0].urgent === true, 'Should parse urgent flag');
    assert(result[0].text === 'Test announcement', 'Should parse text');
  },

  /**
   * Test 34: Attendee parsing
   * Verifies parsing of attendee data rows
   */
  testParseAttendees: () => {
    const data = [['John', 'Dev', 'Google', 'JS, Python', 'Mentorship']];
    const result = parseAttendees(data);
    assert(result.length === 1, 'Should parse one attendee');
    assert(result[0].name === 'John', 'Should parse name');
    assert(result[0].skills === 'JS, Python', 'Should parse skills');
  },

  /**
   * Runs all test methods and reports results
   * Handles both sync and async tests
   */
  runAll: async function () {
    const testNames = Object.keys(this).filter((key) => key.startsWith('test'));
    let passed = 0;
    let failed = 0;

    Logger.info('TestSuite', `Running ${testNames.length} tests...`);
    Logger.info('TestSuite', '─'.repeat(50));

    for (const testName of testNames) {
      try {
        await this[testName]();
        Logger.pass(testName);
        passed++;
      } catch (error) {
        Logger.fail(testName, error);
        failed++;
      }
    }

    Logger.info('TestSuite', '─'.repeat(50));
    Logger.info('TestSuite', `Results: ${passed} passed, ${failed} failed, ${testNames.length} total`);

    return { passed, failed, total: testNames.length };
  }
};
