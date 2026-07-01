using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.Mvc;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Api.Controllers;

public class RemindersControllerTests
{
    private readonly Mock<IReminderService> _reminderServiceMock;
    private readonly RemindersController _controller;

    public RemindersControllerTests()
    {
        _reminderServiceMock = new Mock<IReminderService>();
        _controller = new RemindersController(_reminderServiceMock.Object);
    }


    [Fact]
    public void TestSlashCommand_Should_Call_CreateReminder_And_Return_Accepted()
    {
        int noteId = 42;
        string text = "/remind Call doctor in 5 minutes";

        var result = _controller.TestSlashCommand(noteId, text);

        var acceptedResult = result.Should().BeOfType<AcceptedResult>().Subject;
        acceptedResult.StatusCode.Should().Be(202);

        _reminderServiceMock.Verify(s => 
            s.CreateReminder(noteId, text, "in 1 minute"), 
            Times.Once
        );
    }
}