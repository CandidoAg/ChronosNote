using Xunit;
using FluentAssertions;
using Moq;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Api.Controllers;

public class AIControllerTests
{
    private readonly Mock<IAIEngineService> _aiServiceMock;
    private readonly AIController _controller;

    public AIControllerTests()
    {
        _aiServiceMock = new Mock<IAIEngineService>();
        _controller = new AIController(_aiServiceMock.Object);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ProcessText_Should_Return_BadRequest_When_Text_Is_Missing(string invalidText)
    {
        var request = new AIProcessRequest { Text = invalidText, Action = "summarize" };

        var result = await _controller.ProcessText(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData("invalid_action")]
    [InlineData("")]
    [InlineData(null)]
    public async Task ProcessText_Should_Return_BadRequest_When_Action_Is_Invalid(string invalidAction)
    {
        var request = new AIProcessRequest { Text = "Valid note text", Action = invalidAction };

        var result = await _controller.ProcessText(request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ProcessText_Should_Return_ContentResult_With_Json_When_Successful()
    {
        var request = new AIProcessRequest { Text = "Raw text", Action = "summarize", Language = "en" };
        string expectedJson = "{ \"result\": \"summarized content\" }";
        
        _aiServiceMock.Setup(s => s.ProcessTextAsync(It.IsAny<string>(), "summarize"))
            .ReturnsAsync(expectedJson);

        var result = await _controller.ProcessText(request);

        var contentResult = result.Should().BeOfType<ContentResult>().Subject;
        contentResult.Content.Should().Be(expectedJson);
        contentResult.ContentType.Should().Be("application/json");
    }

    [Fact]
    public async Task ProcessText_Should_Return_500_When_Service_Throws_Exception()
    {
        var request = new AIProcessRequest { Text = "Raw text", Action = "tasks" };
        _aiServiceMock.Setup(s => s.ProcessTextAsync(It.IsAny<string>(), "tasks"))
            .ThrowsAsync(new Exception("Ollama disconnected"));

        var result = await _controller.ProcessText(request);

        var statusCodeResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusCodeResult.StatusCode.Should().Be(500);
    }
}