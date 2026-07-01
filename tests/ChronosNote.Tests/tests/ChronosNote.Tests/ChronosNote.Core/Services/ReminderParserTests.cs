using Xunit;
using FluentAssertions;
using System;

namespace ChronosNote.Core.Services;

public class ReminderParserTests
{
    private readonly ReminderParser _parser;

    public ReminderParserTests()
    {
        _parser = new ReminderParser();
    }

    [Theory]
    [InlineData("/remind comprar leche")]
    [InlineData("/REMIND Buy milk")]
    [InlineData("  /remind  espacio")]
    public void IsReminderCommand_Should_Return_True_For_Valid_Commands(string text)
    {
        bool result = _parser.IsReminderCommand(text);
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("remind sin barra")]
    [InlineData("/remind")]
    public void IsReminderCommand_Should_Return_False_For_Invalid_Commands(string text)
    {
        bool result = _parser.IsReminderCommand(text);
        result.Should().BeFalse();
    }

    [Fact]
    public void Parse_Should_Throw_ArgumentException_When_Command_Is_Invalid()
    {
        Action act = () => _parser.Parse("invalid text");
        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("/remind Call boss in 5 seconds", "Call boss", 5, "second")]
    [InlineData("/remind Meeting in 2 minutes", "Meeting", 2, "minute")]
    [InlineData("/remind Fix bug in 1 hour", "Fix bug", 1, "hour")]
    [InlineData("/remind Project delivery in 3 days", "Project delivery", 3, "day")]
    public void Parse_Should_Extract_Correct_Message_And_Date_For_Relative_Expressions(
        string input, string expectedMessage, int value, string unit)
    {
        var (message, targetDate) = _parser.Parse(input);

        message.Should().Be(expectedMessage);

        DateTimeOffset expectedDate = DateTimeOffset.Now;
        expectedDate = unit switch
        {
            "second" => expectedDate.AddSeconds(value),
            "minute" => expectedDate.AddMinutes(value),
            "hour" => expectedDate.AddHours(value),
            "day" => expectedDate.AddDays(value),
            _ => expectedDate
        };

        targetDate.Should().BeCloseTo(expectedDate, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Parse_Should_Fallback_To_One_Hour_When_No_Time_Expression_Matches()
    {
        string input = "/remind Just a raw message without time keywords";
        var expectedDate = DateTimeOffset.Now.AddHours(1);

        var (message, targetDate) = _parser.Parse(input);

        message.Should().Be("Just a raw message without time keywords");
        targetDate.Should().BeCloseTo(expectedDate, TimeSpan.FromSeconds(5));
    }
}